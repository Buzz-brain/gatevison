import logging
from typing import Optional

import numpy as np

from app.config.settings import settings
from app.models.vehicle_record import VehicleFingerprint
from app.repositories.vehicle_repository import VehicleRepository
from app.services.ai.embedding.similarity_engine import SimilarityEngine
from app.services.ai.vehicle_fingerprint.detector import VehicleDetector
from app.services.ai.vehicle_fingerprint.feature_extractor import (
    VehicleFeatureExtractor,
)
from app.services.ai.vehicle_fingerprint.vehicle_loader import VehicleLoader

logger = logging.getLogger(__name__)


class VehicleFingerprintError(Exception):
    pass


class VehicleFingerprintService:
    def __init__(self):
        self._loader = VehicleLoader()
        self._detector = VehicleDetector()
        self._feature_extractor = VehicleFeatureExtractor()
        self._similarity = SimilarityEngine(
            threshold=settings.VEHICLE_SIMILARITY_THRESHOLD
        )
        self._repository = VehicleRepository()

    def load(self) -> None:
        self._loader.load()

    def is_loaded(self) -> bool:
        return self._loader.is_loaded()

    async def extract_fingerprint(
        self, image: np.ndarray, plate_text: Optional[str] = None,
    ) -> dict:
        detections = self._detector.detect(image)
        if not detections:
            raise VehicleFingerprintError("No vehicles detected")

        detection = detections[0]
        result = self._feature_extractor.extract(image)

        return {
            "embedding": result["embedding"],
            "dimension": result["dimension"],
            "duration_ms": result["duration_ms"],
            "detection": detection,
            "plate_text": plate_text,
        }

    async def store_fingerprint(
        self, plate_text: str, embedding: list[float],
    ) -> VehicleFingerprint:
        existing = await self._repository.find_by_plate(plate_text)
        if existing:
            existing.embedding = embedding
            return await self._repository.update(existing)
        return await self._repository.create(plate_text, embedding)

    async def lookup(
        self, image: np.ndarray, top_k: int = 5,
    ) -> list[dict]:
        result = await self.extract_fingerprint(image)
        query_emb = result["embedding"]

        all_records = await self._repository.get_all()
        if not all_records:
            return []

        candidates = [(str(r.id), r.embedding) for r in all_records]
        matches = self._similarity.top_k(query_emb, candidates, k=top_k)

        for m in matches:
            m["embedding"] = query_emb
            record = next(
                (r for r in all_records if str(r.id) == m["id"]), None
            )
            if record:
                m["plate_text"] = record.plate_text
        return matches

    async def verify(
        self, image: np.ndarray, plate_text: str,
    ) -> dict:
        record = await self._repository.find_by_plate(plate_text)
        if not record:
            return {
                "match": False,
                "score": 0.0,
                "message": "No stored fingerprint for this plate",
            }

        result = await self.extract_fingerprint(image)
        query_emb = result["embedding"]
        score = self._similarity.cosine_similarity(query_emb, record.embedding)
        is_match = self._similarity.is_match(score)

        return {
            "match": is_match,
            "score": round(score, 4),
            "threshold": self._similarity.threshold,
            "message": "Match" if is_match else "No match",
        }

    async def delete_fingerprint(self, plate_text: str) -> bool:
        return await self._repository.delete_by_plate(plate_text)

    def get_model_info(self) -> dict:
        metadata = self._loader.get_metadata()
        return {
            **metadata,
            "similarity_threshold": self._similarity.threshold,
        }

    def health(self) -> dict:
        metadata = self._loader.get_metadata()
        return {
            "status": "healthy" if metadata["loaded"] else "unhealthy",
            "model_loaded": metadata["loaded"],
            "model_name": metadata["model_name"],
            "device": metadata["device"],
        }
