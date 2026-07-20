from app.services.ai.orchestrator.metrics import get_pipeline_metrics


class PerformanceService:
    def get_performance_metrics(self) -> dict:
        metrics = get_pipeline_metrics()
        snapshot = metrics.snapshot()
        recent = metrics.get_recent_requests(10)

        total = snapshot.total_pipelines
        successes = snapshot.success_count
        failures = snapshot.failure_count
        success_rate = (successes / total * 100) if total > 0 else 100.0

        stage_times = {}
        for stage in snapshot.stages:
            stage_times[stage.stage_name] = stage.avg_duration_ms

        slowest = 0.0
        fastest = float("inf")
        for r in recent:
            dur = r.get("total_duration_ms", 0)
            if dur > slowest:
                slowest = dur
            if dur < fastest and dur > 0:
                fastest = dur
        fastest = fastest if fastest != float("inf") else 0.0

        return {
            "avg_pipeline_execution_time_ms": snapshot.avg_total_duration_ms,
            "total_processed_requests": total,
            "success_count": successes,
            "failed_requests": failures,
            "pipeline_success_rate": round(success_rate, 2),
            "avg_stage_times_ms": stage_times,
            "slowest_request_ms": round(slowest, 2),
            "fastest_request_ms": round(fastest, 2),
            "recent_requests": recent,
        }


performance_service = PerformanceService()
