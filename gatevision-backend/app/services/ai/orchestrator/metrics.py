import threading
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class StageMetricsSnapshot:
    stage_name: str
    total_calls: int
    success_count: int
    failure_count: int
    avg_duration_ms: float


@dataclass
class PipelineMetricsSnapshot:
    total_pipelines: int
    success_count: int
    failure_count: int
    avg_total_duration_ms: float
    stages: list[StageMetricsSnapshot] = field(default_factory=list)


@dataclass
class _StageStats:
    total_calls: int = 0
    success_count: int = 0
    failure_count: int = 0
    total_duration_ms: float = 0.0


class PipelineMetrics:
    def __init__(self, max_history: int = 100):
        self._lock = threading.Lock()
        self._stage_stats: dict[str, _StageStats] = {}
        self._total_pipelines: int = 0
        self._pipeline_success: int = 0
        self._pipeline_failure: int = 0
        self._total_pipeline_duration_ms: float = 0.0
        self._recent_requests: deque = deque(maxlen=max_history)

    def record_stage(
        self, stage_name: str, success: bool, duration_ms: float,
    ) -> None:
        with self._lock:
            stats = self._stage_stats.setdefault(stage_name, _StageStats())
            stats.total_calls += 1
            stats.total_duration_ms += duration_ms
            if success:
                stats.success_count += 1
            else:
                stats.failure_count += 1

    def record_pipeline(
        self,
        request_id: str,
        success: bool,
        total_duration_ms: float,
        stage_count: int,
    ) -> None:
        with self._lock:
            self._total_pipelines += 1
            self._total_pipeline_duration_ms += total_duration_ms
            if success:
                self._pipeline_success += 1
            else:
                self._pipeline_failure += 1
            self._recent_requests.append({
                "request_id": request_id,
                "success": success,
                "total_duration_ms": round(total_duration_ms, 2),
                "stage_count": stage_count,
                "timestamp": time.time(),
            })

    def get_recent_requests(self, n: int = 10) -> list:
        with self._lock:
            return list(self._recent_requests)[-n:]

    def snapshot(self) -> PipelineMetricsSnapshot:
        with self._lock:
            stages = [
                StageMetricsSnapshot(
                    stage_name=name,
                    total_calls=s.total_calls,
                    success_count=s.success_count,
                    failure_count=s.failure_count,
                    avg_duration_ms=round(
                        s.total_duration_ms / s.total_calls, 2
                    ) if s.total_calls else 0.0,
                )
                for name, s in sorted(self._stage_stats.items())
            ]
            return PipelineMetricsSnapshot(
                total_pipelines=self._total_pipelines,
                success_count=self._pipeline_success,
                failure_count=self._pipeline_failure,
                avg_total_duration_ms=round(
                    self._total_pipeline_duration_ms / self._total_pipelines, 2
                ) if self._total_pipelines else 0.0,
                stages=stages,
            )


_metrics_instance: Optional[PipelineMetrics] = None
_metrics_lock = threading.Lock()


def get_pipeline_metrics() -> PipelineMetrics:
    global _metrics_instance
    if _metrics_instance is None:
        with _metrics_lock:
            if _metrics_instance is None:
                _metrics_instance = PipelineMetrics()
    return _metrics_instance
