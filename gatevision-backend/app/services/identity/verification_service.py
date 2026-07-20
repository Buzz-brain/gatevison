import logging
from dataclasses import dataclass, field
from typing import Optional

from app.models.driver_profile import DriverProfile
from app.models.vehicle_profile import VehicleProfile
from app.repositories.driver_profile_repository import DriverProfileRepository
from app.repositories.vehicle_profile_repository import VehicleProfileRepository
from app.services.identity.identity_logger import IdentityLogger
from app.services.identity.policy_service import PolicyService

logger = logging.getLogger(__name__)


@dataclass
class VerificationResult:
    plate_found: bool
    vehicle: Optional[VehicleProfile] = None
    driver_found: bool = False
    driver: Optional[DriverProfile] = None
    policy_evaluation: dict = field(default_factory=dict)
    face_match: bool = False
    face_confidence: float = 0.0
    vehicle_match: bool = False
    vehicle_confidence: float = 0.0

    def to_dict(self) -> dict:
        return {
            "plate_found": self.plate_found,
            "vehicle": {
                "vehicle_id": self.vehicle.vehicle_id,
                "plate_number": self.vehicle.plate_number,
                "status": self.vehicle.registration_status,
                "linked_drivers": self.vehicle.linked_driver_ids,
            } if self.vehicle else None,
            "driver_found": self.driver_found,
            "driver": {
                "driver_id": self.driver.driver_id,
                "full_name": self.driver.full_name,
                "status": self.driver.status,
            } if self.driver else None,
            "policy_evaluation": self.policy_evaluation,
            "face_match": self.face_match,
            "face_confidence": self.face_confidence,
            "vehicle_match": self.vehicle_match,
            "vehicle_confidence": self.vehicle_confidence,
        }


class VerificationService:
    def __init__(self):
        self._vehicle_repo = VehicleProfileRepository()
        self._driver_repo = DriverProfileRepository()
        self._policy = PolicyService()
        self._log = IdentityLogger()

    async def verify(
        self,
        plate_text: str,
        face_embedding: Optional[list[float]] = None,
        vehicle_embedding: Optional[list[float]] = None,
        face_threshold: float = 0.65,
        vehicle_threshold: float = 0.75,
    ) -> VerificationResult:
        from app.services.ai.embedding.similarity_engine import SimilarityEngine

        similarity = SimilarityEngine()

        vehicle = await self._vehicle_repo.get_by_plate(plate_text)
        self._log.log_verify(plate_text, vehicle is not None)

        if not vehicle:
            return VerificationResult(plate_found=False)

        policy_eval = await self._policy.evaluate_for_target(
            "vehicle", vehicle.vehicle_id,
        )

        face_match = False
        face_conf = 0.0
        driver_found = False
        driver = None

        if face_embedding and vehicle.linked_driver_ids:
            for did in vehicle.linked_driver_ids:
                d = await self._driver_repo.get_by_driver_id(did)
                if d and d.face_embedding_reference and d.status == "active":
                    driver = d
                    driver_found = True
                    face_conf = similarity.cosine_similarity(
                        face_embedding, d.face_embedding_reference,
                    )
                    face_match = face_conf >= face_threshold
                    if face_match:
                        break

        vehicle_match = False
        vehicle_conf = 0.0

        if vehicle_embedding and vehicle.vehicle_embedding_reference:
            vehicle_conf = similarity.cosine_similarity(
                vehicle_embedding, vehicle.vehicle_embedding_reference,
            )
            vehicle_match = vehicle_conf >= vehicle_threshold

        return VerificationResult(
            plate_found=True,
            vehicle=vehicle,
            driver_found=driver_found,
            driver=driver,
            policy_evaluation=policy_eval,
            face_match=face_match,
            face_confidence=face_conf,
            vehicle_match=vehicle_match,
            vehicle_confidence=vehicle_conf,
        )
