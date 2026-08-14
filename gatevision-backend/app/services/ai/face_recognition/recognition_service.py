import logging
import time
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

from app.config.settings import settings
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.face_recognition.aligner import FaceAligner, FaceAlignmentError
from app.services.ai.face_recognition.detector import FaceDetector, FaceDetectionError
from app.services.ai.face_recognition.embedding_service import (
    EmbeddingService,
    EmbeddingExtractionError,
)
from app.services.ai.face_recognition.face_loader import FaceLoader
from app.services.ai.face_recognition.recognition_logger import FaceRecognitionLogger
from app.services.ai.face_recognition.similarity import SimilarityService
from app.repositories.face_repository import FaceRepository

logger = logging.getLogger(__name__)


class FaceRecognitionService:
    def __init__(
        self,
        detector: Optional[FaceDetector] = None,
        aligner: Optional[FaceAligner] = None,
        embedding_service: Optional[EmbeddingService] = None,
        similarity_service: Optional[SimilarityService] = None,
        repository: Optional[FaceRepository] = None,
    ):
        self.detector = detector or FaceDetector()
        self.aligner = aligner or FaceAligner()
        self.embedding_service = embedding_service or EmbeddingService()
        self.similarity = similarity_service or SimilarityService()
        self.repository = repository or FaceRepository()
        self.logger = FaceRecognitionLogger()

    def is_available(self) -> bool:
        """True when the InsightFace model directory is present locally.

        Loading the model when it is absent triggers a large (~200MB)
        auto-download on first use, which is unacceptable inside a live
        pipeline request, so the orchestrator checks this before running.
        """
        model_dir = (
            Path.home() / ".insightface" / "models" / settings.FACE_MODEL_NAME
        )
        return model_dir.is_dir()

    async def recognize_from_image(
        self, image: np.ndarray, reference_embedding: Optional[list[float]] = None,
    ) -> dict:
        self.logger.recognition_started("image")
        start_total = time.perf_counter()

        faces = self.detector.detect(image)
        if not faces:
            self.logger.no_face_detected()
            return {
                "face_detected": False,
                "face_count": 0,
                "detections": [],
                "similarity_score": None,
                "matched": False,
                "embedding_dimension": 0,
                "inference_time_ms": 0.0,
            }

        self.logger.face_detected(len(faces))
        detections = []

        for i, face in enumerate(faces):
            bbox = face["bbox"]
            landmarks = face["landmarks"]

            try:
                aligned = self._align_face(image, landmarks)
                self.logger.face_aligned()
            except FaceAlignmentError:
                aligned = image

            try:
                emb_result = self.embedding_service.extract(aligned)
                self.logger.embedding_extracted(emb_result["dimension"])
            except EmbeddingExtractionError as e:
                self.logger.recognition_failure(str(e))
                continue

            similarity_score = None
            matched = False
            if reference_embedding is not None and emb_result["embedding"]:
                similarity_score = self.similarity.cosine_similarity(
                    reference_embedding, emb_result["embedding"],
                )
                matched = self.similarity.is_match(similarity_score)
                self.logger.similarity_computed(similarity_score, matched)

            detections.append({
                "bbox": bbox,
                "confidence": face["confidence"],
                "cropped_face_path": face.get("cropped_face_path", ""),
                "embedding": emb_result["embedding"],
                "embedding_dimension": emb_result["dimension"],
                "similarity_score": similarity_score,
                "matched": matched,
                "inference_time_ms": emb_result["inference_time_ms"],
            })

        total_time = (time.perf_counter() - start_total) * 1000

        result = {
            "face_detected": True,
            "face_count": len(faces),
            "detections": detections,
            "similarity_score": detections[0].get("similarity_score") if detections else None,
            "matched": detections[0].get("matched", False) if detections else False,
            "embedding_dimension": detections[0].get("embedding_dimension", 0) if detections else 0,
            "inference_time_ms": round(total_time, 2),
        }

        await self._persist_result(result)
        self.logger.recognition_completed()

        return result

    async def recognize_from_bytes(
        self, data: bytes, reference_embedding: Optional[list[float]] = None,
    ) -> dict:
        image = FrameProcessor.read_bytes(data)
        if image is None:
            return {
                "face_detected": False,
                "face_count": 0,
                "detections": [],
                "similarity_score": None,
                "matched": False,
                "embedding_dimension": 0,
                "inference_time_ms": 0.0,
            }
        return await self.recognize_from_image(image, reference_embedding)

    async def recognize_from_path(
        self, path: str, reference_embedding: Optional[list[float]] = None,
    ) -> dict:
        image = cv2.imread(path)
        if image is None:
            return {
                "face_detected": False,
                "face_count": 0,
                "detections": [],
                "similarity_score": None,
                "matched": False,
                "embedding_dimension": 0,
                "inference_time_ms": 0.0,
            }
        return await self.recognize_from_image(image, reference_embedding)

    async def compare_embeddings(
        self, embedding_a: list[float], embedding_b: list[float],
        metric: str = "cosine",
    ) -> dict:
        if metric == "cosine":
            score = self.similarity.cosine_similarity(embedding_a, embedding_b)
        elif metric == "euclidean":
            score = 1.0 / (1.0 + self.similarity.euclidean_distance(
                embedding_a, embedding_b
            ))
        else:
            raise ValueError(f"Unknown metric: {metric}")

        is_match = self.similarity.is_match(score)
        return {
            "similarity_score": round(score, 4),
            "is_match": is_match,
            "threshold": self.similarity.threshold,
            "distance_metric": metric,
        }

    async def get_history(
        self, skip: int = 0, limit: int = 100,
    ) -> list:
        records = await self.repository.get_recent(skip=skip, limit=limit)
        return [
            {
                "id": str(r.id),
                "detection_confidence": r.detection_confidence,
                "similarity_score": r.similarity_score,
                "matched": r.matched,
                "inference_time": r.inference_time,
                "created_at": r.created_at,
            }
            for r in records
        ]

    async def get_model_info(self) -> dict:
        loader = FaceLoader()
        return loader.get_metadata()

    def _align_face(self, image: np.ndarray, landmarks: list) -> np.ndarray:
        return self.aligner.align(image, landmarks)

    async def _persist_result(self, result: dict) -> None:
        for det in result.get("detections", []):
            try:
                await self.repository.create(
                    image_id="",
                    embedding=det.get("embedding", []),
                    embedding_dimension=det.get("embedding_dimension", 0),
                    detection_confidence=det.get("confidence", 0.0),
                    similarity_score=det.get("similarity_score"),
                    matched=det.get("matched", False),
                    cropped_face_path=det.get("cropped_face_path", ""),
                    inference_time=det.get("inference_time_ms", 0.0),
                )
            except Exception as e:
                logger.error("Failed to persist face record: %s", e)
