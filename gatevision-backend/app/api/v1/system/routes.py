import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.response import APIResponse
from app.schemas.system import (
    BackupExportRequest,
    BackupImportRequest,
)
from app.services.system.backup_service import backup_service
from app.services.system.cleanup_service import cleanup_service
from app.services.system.configuration_service import configuration_service
from app.services.system.health_service import health_service
from app.services.system.model_monitor_service import model_monitor_service
from app.services.system.monitoring_service import monitoring_service
from app.services.system.performance_service import performance_service
from app.services.system.storage_service import system_storage_service
from app.services.system.system_logger import system_logger
from app.services.system.version_service import version_service
from app.api.v1.auth.routes import get_current_user
from app.models.user import User, UserRole

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/system", tags=["System"])


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return user


@router.get("/health")
async def get_system_health():
    try:
        data = await health_service.check_health()
        return APIResponse(success=True, data=data)
    except Exception as e:
        system_logger.critical_error("health", str(e))
        return APIResponse(
            success=False,
            message="Health check failed",
            data={
                "overall_status": "unhealthy",
                "components": {},
                "checked_at": None,
            },
        )


@router.get("/models")
async def get_system_models():
    infos = model_monitor_service.get_all_model_infos()
    models = []
    for info in infos:
        models.append({
            "id": info.get("name", "").lower().replace(" ", "-"),
            "name": info.get("name", ""),
            "status": "healthy" if info.get("loaded") else "unloaded",
            "version": info.get("version", ""),
            "device": info.get("device", "cpu"),
            "memory_mb": info.get("memory_mb"),
            "inference_count": info.get("total_inference_count", 0),
            "avg_latency_ms": info.get("avg_inference_time_ms", 0.0),
            "error_count": info.get("error_count", 0),
            "last_loaded": info.get("last_inference_timestamp"),
        })
    return APIResponse(success=True, data=models)

@router.get("/health/models")
async def get_model_health():
    models = model_monitor_service.get_all_model_infos()
    return APIResponse(success=True, data={"models": models})


@router.get("/health/models/{model_name}")
async def get_model_detail(model_name: str):
    detail = model_monitor_service.get_model_detail(model_name)
    if detail is None:
        return APIResponse(success=False, message=f"Model '{model_name}' not found")
    return APIResponse(success=True, data=detail)


@router.get("/health/database")
async def get_database_health():
    data = await health_service.check_database_health()
    return APIResponse(success=True, data=data)


@router.get("/health/storage")
async def get_storage_health():
    result = await health_service.check_health()
    storage = result["components"].get("storage", {})
    return APIResponse(success=True, data=storage)


@router.get("/performance")
async def get_performance_metrics():
    data = performance_service.get_performance_metrics()
    return APIResponse(success=True, data=data)


@router.get("/configuration")
async def get_configuration():
    config = configuration_service.get_configuration()
    warnings = configuration_service.validate_configuration()
    return APIResponse(success=True, data={
        "settings": config,
        "warnings": warnings,
    })


@router.get("/version")
async def get_version():
    data = version_service.get_version_info()
    return APIResponse(success=True, data=data)


@router.get("/storage")
async def get_storage_info():
    data = await system_storage_service.get_storage_info()
    return APIResponse(success=True, data=data)


@router.post("/storage/cleanup")
async def cleanup_storage(admin: User = Depends(require_admin)):
    result = await cleanup_service.cleanup()
    return APIResponse(success=True, data=result)


@router.post("/backup/export")
async def export_backup(
    req: BackupExportRequest,
    admin: User = Depends(require_admin),
):
    if req.backup_type == "configuration":
        result = await backup_service.export_configuration()
    else:
        result = await backup_service.export_database(collections=req.collections)
    return APIResponse(success=result["success"], data=result)


@router.post("/backup/import")
async def import_backup(
    req: BackupImportRequest,
    admin: User = Depends(require_admin),
):
    result = await backup_service.import_database(req.filename)
    return APIResponse(success=result["success"], data=result)


@router.get("/backups")
async def list_backups(admin: User = Depends(require_admin)):
    backups = backup_service.list_backups()
    return APIResponse(success=True, data={"backups": backups})


@router.get("/logs/statistics")
async def get_log_statistics(
    hours: int = Query(24, ge=1, le=720),
    admin: User = Depends(require_admin),
):
    data = await monitoring_service.get_log_statistics(hours=hours)
    return APIResponse(success=True, data=data)
