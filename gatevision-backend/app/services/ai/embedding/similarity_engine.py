import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)


class SimilarityEngine:
    def __init__(self, threshold: Optional[float] = None):
        self._threshold = threshold

    @property
    def threshold(self) -> Optional[float]:
        return self._threshold

    @threshold.setter
    def threshold(self, value: Optional[float]) -> None:
        self._threshold = value

    @staticmethod
    def cosine_similarity(a: list[float], b: list[float]) -> float:
        arr_a = np.array(a, dtype=np.float64)
        arr_b = np.array(b, dtype=np.float64)
        norm_a = np.linalg.norm(arr_a)
        norm_b = np.linalg.norm(arr_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(arr_a, arr_b) / (norm_a * norm_b))

    @staticmethod
    def euclidean_distance(a: list[float], b: list[float]) -> float:
        return float(np.linalg.norm(np.array(a, dtype=np.float64) - np.array(b, dtype=np.float64)))

    def is_match(self, score: float) -> bool:
        if self._threshold is None:
            return True
        return score >= self._threshold

    def top_k(
        self,
        query: list[float],
        candidates: list[tuple[str, list[float]]],
        k: int = 5,
        metric: str = "cosine",
    ) -> list[dict]:
        if metric == "cosine":
            scores = [(cid, self.cosine_similarity(query, emb)) for cid, emb in candidates]
            scores.sort(key=lambda x: x[1], reverse=True)
        elif metric == "euclidean":
            scores = [(cid, -self.euclidean_distance(query, emb)) for cid, emb in candidates]
            scores.sort(key=lambda x: x[1], reverse=True)
        else:
            raise ValueError(f"Unknown metric: {metric}")

        return [
            {"id": cid, "score": round(score, 4), "metric": metric}
            for cid, score in scores[:k]
        ]
