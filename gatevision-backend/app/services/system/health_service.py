import logging
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.config.settings import settings
from app.services.ai.registry.model_registry import ModelRegistry
from app.services.ai.orchestrator.metrics import get_pipeline_metrics
from app.repositories.monitoring_repository import MonitoringRepository
from app.models.system_health import SystemHealth, SystemHealthStatus
from app.schemas.system import ComponentHealth

logger = logging.getLogger(__name__)


class HealthService:
    def __init__(self) -> None:
        self._registry = ModelRegistry()
        self._monitoring_repo = MonitoringRepository()

    async def check_health(self) -> dict:
        components: dict[str, ComponentHealth] = {}
        components["app"] = await self._check_app()
        components["mongodb"] = await self._check_mongodb()
        components["camera"] = self._check_camera()
        components["pipeline"] = self._check_pipeline()
        components["storage"] = self._check_storage()
        components["model_registry"] = self._check_model_registry()

        status_counts = {}
        for c in components.values():
            status_counts[c.status] = status_counts.get(c.status, 0) + 1

        unhealthy_count = status_counts.get("unhealthy", 0)
        degraded_count = status_counts.get("degraded", 0)
        total = len(components)

        if unhealthy_count > 0:
            overall = SystemHealthStatus.UNHEALTHY
        elif degraded_count == total:
            overall = SystemHealthStatus.DEGRADED
        elif degraded_count > 0:
            overall = SystemHealthStatus.DEGRADED
        else:
            overall = SystemHealthStatus.HEALTHY

        record = await self._monitoring_repo.record_health(
            status=overall,
            app_healthy=components["app"].healthy,
            mongodb_healthy=components["mongodb"].healthy,
            camera_healthy=components["camera"].healthy,
            pipeline_healthy=components["pipeline"].healthy,
            storage_healthy=components["storage"].healthy,
            model_registry_healthy=components["model_registry"].healthy,
            details={k: v.model_dump() for k, v in components.items()},
        )

        return {
            "overall_status": overall.value,
            "components": {k: v.model_dump() for k, v in components.items()},
            "checked_at": record.checked_at.isoformat(),
        }

    async def check_database_health(self) -> dict:
        try:
            stats = await self._monitoring_repo.get_db_stats()
            return {
                "healthy": True,
                "status": "connected",
                "details": stats,
            }
        except Exception as e:
            return {
                "healthy": False,
                "status": "error",
                "message": str(e),
            }

    async def _check_app(self) -> ComponentHealth:
        return ComponentHealth(
            healthy=True,
            status="healthy",
            message=f"GateVision API v{settings.VERSION} running",
        )

    async def _check_mongodb(self) -> ComponentHealth:
        try:
            stats = await self._monitoring_repo.get_db_stats()
            return ComponentHealth(
                healthy=True,
                status="healthy",
                message=f"Connected to {stats['database']} ({stats['collections']} collections)",
            )
        except Exception as e:
            return ComponentHealth(
                healthy=False,
                status="unhealthy",
                message=f"Database connection failed: {e}",
            )

    def _check_camera(self) -> ComponentHealth:
        try:
            from app.services.ai.camera.camera_service import CameraService
            svc = CameraService()
            status = svc.get_status()
            if status.get("active", False):
                return ComponentHealth(
                    healthy=True,
                    status="healthy",
                    message="Camera is active",
                )
            return ComponentHealth(
                healthy=False,
                status="degraded",
                message="Camera is inactive",
            )
        except Exception as e:
            return ComponentHealth(
                healthy=False,
                status="unhealthy",
                message=f"Camera error: {e}",
            )

    def _check_pipeline(self) -> ComponentHealth:
        try:
            metrics = get_pipeline_metrics()
            snapshot = metrics.snapshot()
            total = snapshot.total_pipelines
            failures = snapshot.failure_count
            if total == 0:
                return ComponentHealth(
                    healthy=True,
                    status="healthy",
                    message="Pipeline available (no requests yet)",
                )
            success_rate = (snapshot.success_count / total * 100) if total > 0 else 100
            if success_rate >= 95:
                return ComponentHealth(
                    healthy=True,
                    status="healthy",
                    message=f"Pipeline healthy ({success_rate:.1f}% success rate)",
                )
            return ComponentHealth(
                healthy=True,
                status="degraded",
                message=f"Pipeline degraded ({success_rate:.1f}% success rate, {failures} failures)",
            )
        except Exception as e:
            return ComponentHealth(
                healthy=False,
                status="unhealthy",
                message=f"Pipeline check failed: {e}",
            )

    def _check_storage(self) -> ComponentHealth:
        try:
            upload_dir = settings.BASE_DIR / settings.UPLOAD_DIR
            if not upload_dir.exists():
                return ComponentHealth(
                    healthy=True,
                    status="healthy",
                    message="Upload directory not yet created",
                )
            total = sum(f.stat().st_size for f in upload_dir.rglob("*") if f.is_file())
            free = shutil.disk_usage(upload_dir).free
            free_gb = free / (1024 ** 3)
            if free_gb < 0.5:
                return ComponentHealth(
                    healthy=True,
                    status="degraded",
                    message=f"Low disk space: {free_gb:.1f} GB free",
                )
            return ComponentHealth(
                healthy=True,
                status="healthy",
                message=f"Storage OK ({free_gb:.1f} GB free)",
            )
        except Exception as e:
            return ComponentHealth(
                healthy=False,
                status="unhealthy",
                message=f"Storage check failed: {e}",
            )

    def _check_model_registry(self) -> ComponentHealth:
        try:
            summary = self._registry.health_summary()
            if summary["healthy"]:
                return ComponentHealth(
                    healthy=True,
                    status="healthy",
                    message=f"All {summary['loaded_models']}/{summary['total_models']} models loaded",
                )
            return ComponentHealth(
                healthy=True,
                status="degraded",
                message=f"{summary['loaded_models']}/{summary['total_models']} models loaded",
            )
        except Exception as e:
            return ComponentHealth(
                healthy=False,
                status="unhealthy",
                message=f"Model registry check failed: {e}",
            )


health_service = HealthService()
