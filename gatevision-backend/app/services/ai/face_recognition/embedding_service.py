import logging
import time
from typing import Optional

import numpy as np

from app.services.ai.face_recognition.face_loader import FaceLoader, FaceLoadError

logger = logging.getLogger(__name__)


class EmbeddingExtractionError(Exception):
    pass


class EmbeddingService:
    def __init__(self, loader: Optional[FaceLoader] = None):
        self._loader = loader or FaceLoader()
        self._dimension: int = 512

    def extract(self, image: np.ndarray) -> dict:
        if image is None or image.size == 0:
            raise EmbeddingExtractionError("Empty image for embedding extraction")

        try:
            app = self._loader.get_app()
        except FaceLoadError:
            self._loader.load()
            app = self._loader.get_app()

        start = time.perf_counter()
        faces = app.get(image)
        elapsed = (time.perf_counter() - start) * 1000

        if not faces:
            raise EmbeddingExtractionError("No face detected for embedding extraction")

        face = faces[0]
        embedding = face.embedding.astype(np.float64)

        return {
            "embedding": embedding.tolist(),
            "dimension": len(embedding),
            "inference_time_ms": round(elapsed, 2),
            "detection_confidence": float(face.det_score),
        }

    def extract_all(self, image: np.ndarray) -> list[dict]:
        if image is None or image.size == 0:
            raise EmbeddingExtractionError("Empty image for embedding extraction")

        try:
            app = self._loader.get_app()
        except FaceLoadError:
            self._loader.load()
            app = self._loader.get_app()

        start = time.perf_counter()
        faces = app.get(image)
        elapsed = (time.perf_counter() - start) * 1000

        results = []
        for face in faces:
            embedding = face.embedding.astype(np.float64)
            results.append({
                "embedding": embedding.tolist(),
                "dimension": len(embedding),
                "inference_time_ms": round(elapsed, 2),
                "detection_confidence": float(face.det_score),
            })

        return results

    @property
    def dimension(self) -> int:
        return self._dimension
