import logging
from typing import Optional

import numpy as np

from app.config.settings import settings

logger = logging.getLogger(__name__)


class SimilarityService:
    def __init__(self, threshold: Optional[float] = None):
        self.threshold = threshold if threshold is not None else settings.FACE_SIMILARITY_THRESHOLD

    @staticmethod
    def cosine_similarity(embedding_a: list[float], embedding_b: list[float]) -> float:
        a = np.array(embedding_a, dtype=np.float64)
        b = np.array(embedding_b, dtype=np.float64)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    @staticmethod
    def euclidean_distance(embedding_a: list[float], embedding_b: list[float]) -> float:
        a = np.array(embedding_a, dtype=np.float64)
        b = np.array(embedding_b, dtype=np.float64)
        return float(np.linalg.norm(a - b))

    def is_match(self, similarity_score: float) -> bool:
        return similarity_score >= self.threshold
