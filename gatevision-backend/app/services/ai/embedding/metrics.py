import threading
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ExtractionSnapshot:
    total_extractions: int = 0
    total_duration_ms: float = 0.0
    avg_duration_ms: float = 0.0


class EmbeddingMetrics:
    def __init__(self, max_history: int = 100):
        self._lock = threading.Lock()
        self._extraction_count: int = 0
        self._total_duration_ms: float = 0.0
        self._recent: deque = deque(maxlen=max_history)

    def record_extraction(self, duration_ms: float, dimension: int) -> None:
        with self._lock:
            self._extraction_count += 1
            self._total_duration_ms += duration_ms
            self._recent.append({
                "duration_ms": round(duration_ms, 2),
                "dimension": dimension,
                "timestamp": time.time(),
            })

    def snapshot(self) -> ExtractionSnapshot:
        with self._lock:
            avg = round(self._total_duration_ms / self._extraction_count, 2) if self._extraction_count else 0.0
            return ExtractionSnapshot(
                total_extractions=self._extraction_count,
                total_duration_ms=round(self._total_duration_ms, 2),
                avg_duration_ms=avg,
            )

    def get_recent(self, n: int = 10) -> list:
        with self._lock:
            return list(self._recent)[-n:]


_metrics_instance: Optional[EmbeddingMetrics] = None
_metrics_lock = threading.Lock()


def get_embedding_metrics() -> EmbeddingMetrics:
    global _metrics_instance
    if _metrics_instance is None:
        with _metrics_lock:
            if _metrics_instance is None:
                _metrics_instance = EmbeddingMetrics()
    return _metrics_instance
