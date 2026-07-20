import logging
from typing import Optional

import cv2
import numpy as np

from app.services.identity.registration_service import RegistrationService
from app.services.admin.event_logger import EventLogger

logger = logging.getLogger(__name__)


class EnrollmentError(Exception):
    pass


class EnrollmentService:
    def __init__(
        self,
        face_recognition_service=None,
        vehicle_fingerprint_service=None,
    ):
        self._registration = RegistrationService()
        self._face_svc = face_recognition_service
        self._vehicle_svc = vehicle_fingerprint_service
        self._events = EventLogger()

    async def enroll_driver_with_image(
        self,
        driver_id: str,
        image: np.ndarray,
        full_name: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        department: Optional[str] = None,
    ) -> dict:
        if self._face_svc is None:
            raise EnrollmentError(
                "Face recognition service not available"
            )

        # Register driver first
        profile = await self._registration.register_driver(
            driver_id=driver_id,
            full_name=full_name,
            email=email,
            phone=phone,
            department=department,
        )

        # Extract face embedding
        try:
            face_result = await self._face_svc.recognize_from_image(image)
            if not face_result.get("face_detected", False):
                raise EnrollmentError("No face detected in image")
            embeddings = face_result.get("embeddings", [])
            if not embeddings:
                raise EnrollmentError("Failed to extract face embedding")
            embedding = embeddings[0]
        except Exception as e:
            raise EnrollmentError(f"Face embedding extraction failed: {e}") from e

        # Store face embedding
        profile = await self._registration.store_face_embedding(
            driver_id, embedding,
        )

        await self._events.log_event(
            event_type="driver_enrolled",
            severity="info",
            source="admin",
            description=f"Driver '{driver_id}' enrolled with face embedding",
            metadata={"driver_id": driver_id},
        )

        return {
            "driver_id": driver_id,
            "full_name": full_name,
            "face_embedding_dimension": len(embedding),
        }

    async def enroll_vehicle_with_image(
        self,
        vehicle_id: str,
        plate_number: str,
        image: np.ndarray,
        make: Optional[str] = None,
        model: Optional[str] = None,
        color: Optional[str] = None,
        year: Optional[int] = None,
        owner_id: Optional[str] = None,
    ) -> dict:
        if self._vehicle_svc is None:
            raise EnrollmentError(
                "Vehicle fingerprint service not available"
            )

        # Register vehicle first
        profile = await self._registration.register_vehicle(
            vehicle_id=vehicle_id,
            plate_number=plate_number,
            make=make,
            model=model,
            color=color,
            year=year,
            owner_id=owner_id,
        )

        # Extract vehicle embedding
        try:
            fp_result = await self._vehicle_svc.extract_fingerprint(
                image, plate_text=plate_number,
            )
            embedding = fp_result.get("embedding", [])
            if not embedding:
                raise EnrollmentError("Failed to extract vehicle fingerprint")
        except Exception as e:
            raise EnrollmentError(
                f"Vehicle fingerprint extraction failed: {e}"
            ) from e

        # Store vehicle embedding
        profile = await self._registration.store_vehicle_embedding(
            vehicle_id, embedding,
        )

        await self._events.log_event(
            event_type="vehicle_enrolled",
            severity="info",
            source="admin",
            description=f"Vehicle '{vehicle_id}' ({plate_number}) enrolled with fingerprint",
            metadata={
                "vehicle_id": vehicle_id,
                "plate_number": plate_number,
            },
        )

        return {
            "vehicle_id": vehicle_id,
            "plate_number": plate_number,
            "embedding_dimension": len(embedding),
        }

    async def link_and_enroll(
        self,
        vehicle_id: str,
        driver_ids: list[str],
    ) -> dict:
        profile = await self._registration.link_drivers(
            vehicle_id, driver_ids,
        )

        await self._events.log_event(
            event_type="drivers_linked",
            severity="info",
            source="admin",
            description=f"Drivers {driver_ids} linked to vehicle '{vehicle_id}'",
            metadata={
                "vehicle_id": vehicle_id,
                "driver_ids": driver_ids,
            },
        )

        return {
            "vehicle_id": vehicle_id,
            "linked_driver_ids": profile.linked_driver_ids,
        }
