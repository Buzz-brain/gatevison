import logging

logger = logging.getLogger(__name__)


class PipelineLogger:
    def pipeline_started(self, request_id: str, stages: list[str]) -> None:
        logger.info(
            "Pipeline started",
            extra={"request_id": request_id, "stages": stages, "event": "pipeline_started"},
        )

    def stage_started(self, request_id: str, stage_name: str) -> None:
        logger.info(
            "Stage started: %s", stage_name,
            extra={"request_id": request_id, "stage": stage_name, "event": "stage_started"},
        )

    def stage_completed(
        self, request_id: str, stage_name: str, duration_ms: float
    ) -> None:
        logger.info(
            "Stage completed: %s (%.2fms)", stage_name, duration_ms,
            extra={
                "request_id": request_id,
                "stage": stage_name,
                "duration_ms": round(duration_ms, 2),
                "event": "stage_completed",
            },
        )

    def stage_failed(
        self, request_id: str, stage_name: str, error: str, fatal: bool = False,
    ) -> None:
        level = "FATAL" if fatal else "ERROR"
        logger.error(
            "Stage %s: %s (%s)", stage_name, error, level,
            extra={
                "request_id": request_id,
                "stage": stage_name,
                "error": error,
                "fatal": fatal,
                "event": "stage_failed",
            },
        )

    def pipeline_completed(
        self, request_id: str, success: bool, total_duration_ms: float,
    ) -> None:
        logger.info(
            "Pipeline %s (%.2fms)",
            "succeeded" if success else "failed",
            total_duration_ms,
            extra={
                "request_id": request_id,
                "success": success,
                "total_duration_ms": round(total_duration_ms, 2),
                "event": "pipeline_completed",
            },
        )
