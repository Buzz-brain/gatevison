import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.system.routes import router, get_current_user
from app.models.user import User, UserRole
from app.services.system.system_logger import system_logger


MOCK_ADMIN = MagicMock(spec=User)
MOCK_ADMIN.id = "admin-int-1"
MOCK_ADMIN.role = UserRole.ADMIN
MOCK_ADMIN.email = "admin@test.com"


async def override_get_current_user():
    return MOCK_ADMIN


@pytest.fixture
def app():
    application = FastAPI()
    application.dependency_overrides[get_current_user] = override_get_current_user
    application.include_router(router)
    return application


# ────────────────────────────────────────────────────────────────
# Health -> Storage -> Cleanup -> Backup -> Restore -> Logs
# ────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_full_system_workflow(app):
    with patch("app.api.v1.system.routes.health_service") as h, \
         patch("app.api.v1.system.routes.monitoring_service") as mo, \
         patch("app.api.v1.system.routes.system_storage_service") as s, \
         patch("app.api.v1.system.routes.cleanup_service") as cl, \
         patch("app.api.v1.system.routes.backup_service") as b:

        h.check_health = AsyncMock(return_value={
            "overall_status": "healthy",
            "components": {
                "app": {"healthy": True, "status": "healthy", "message": "OK"},
                "mongodb": {"healthy": True, "status": "healthy", "message": "OK"},
                "camera": {"healthy": False, "status": "degraded", "message": "Camera inactive"},
                "pipeline": {"healthy": True, "status": "healthy", "message": "OK"},
                "storage": {"healthy": True, "status": "healthy", "message": "OK"},
                "model_registry": {"healthy": True, "status": "healthy", "message": "OK"},
            },
            "checked_at": "2024-01-01T00:00:00",
        })

        s.get_storage_info = AsyncMock(return_value={
            "upload_directory_size_bytes": 5000,
            "total_images": 25,
            "images_by_category": {"entry": 10, "exit": 5, "face": 5, "vehicle": 3, "plate": 2},
            "total_cropped_plates": 2,
            "total_cropped_faces": 5,
            "total_vehicle_images": 3,
            "orphaned_files": 3,
            "available_disk_space_bytes": 50000000000,
        })

        cl.cleanup = AsyncMock(return_value={
            "deleted_files": 3,
            "deleted_temp_files": 2,
            "deleted_empty_dirs": 1,
            "freed_bytes": 15000,
        })

        b.export_database = AsyncMock(return_value={
            "success": True, "message": "Database exported",
            "filename": "gatevision_backup_20240101.json",
            "collections": ["users", "drivers", "vehicles", "sessions", "transactions", "decisions"],
            "record_count": 150,
            "size_bytes": 45000,
        })
        b.import_database = AsyncMock(return_value={
            "success": True, "message": "Import completed",
            "collections_imported": ["users", "drivers"],
            "total_records": 50,
            "errors": [],
        })

        mo.get_log_statistics = AsyncMock(return_value={
            "total_events": 200,
            "event_types": {"user_login": 80, "model_load": 10, "cleanup": 5, "backup": 3},
            "severity_counts": {"info": 180, "warning": 15, "error": 5},
            "recent_events": 50,
            "errors_last_24h": 2,
        })

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:

            # 1. Health check
            r1 = await ac.get("/system/health")
            assert r1.status_code == 200
            h1 = r1.json()
            assert h1["success"] is True
            assert h1["data"]["overall_status"] == "healthy"
            assert h1["data"]["components"]["app"]["healthy"] is True
            assert h1["data"]["components"]["camera"]["healthy"] is False

            # 2. Storage info
            r2 = await ac.get("/system/storage")
            assert r2.status_code == 200
            h2 = r2.json()
            assert h2["success"] is True
            assert h2["data"]["orphaned_files"] > 0

            # 3. Cleanup
            r3 = await ac.post("/system/storage/cleanup")
            assert r3.status_code == 200
            h3 = r3.json()
            assert h3["success"] is True
            assert h3["data"]["deleted_files"] == 3

            # 4. Backup export
            r4 = await ac.post("/system/backup/export", json={"backup_type": "database"})
            assert r4.status_code == 200
            h4 = r4.json()
            assert h4["success"] is True
            assert h4["data"]["record_count"] == 150

            # 5. Backup import
            r5 = await ac.post("/system/backup/import", json={"filename": "backup.json"})
            assert r5.status_code == 200
            h5 = r5.json()
            assert h5["success"] is True
            assert len(h5["data"]["collections_imported"]) == 2

            # 6. Log statistics
            r6 = await ac.get("/system/logs/statistics", params={"hours": 24})
            assert r6.status_code == 200
            h6 = r6.json()
            assert h6["success"] is True
            assert h6["data"]["total_events"] == 200
            assert h6["data"]["errors_last_24h"] == 2


# ────────────────────────────────────────────────────────────────
# Health check failure propagation
# ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_check_propagates_errors(app):
    with patch("app.api.v1.system.routes.health_service.check_health") as mock_check:
        mock_check.side_effect = RuntimeError("Unexpected failure")

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/system/health")
            data = resp.json()
            assert data["success"] is False
            assert data["data"]["overall_status"] == "unhealthy"


# ────────────────────────────────────────────────────────────────
# Backup edge cases
# ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_backup_import_file_not_found(app):
    with patch("app.api.v1.system.routes.backup_service.import_database") as mock_import:
        mock_import.return_value = {
            "success": False,
            "message": "Backup file not found",
            "collections_imported": [],
            "total_records": 0,
            "errors": ["File not found"],
        }

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post(
                "/system/backup/import",
                json={"filename": "nonexistent.json"},
            )
            data = resp.json()
            assert data["success"] is False
            assert "not found" in data["data"]["message"]


# ────────────────────────────────────────────────────────────────
# Model monitoring
# ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_model_monitoring_multiple_models(app):
    with patch("app.api.v1.system.routes.model_monitor_service") as mm:

        mm.get_all_model_infos.return_value = [
            {
                "name": "YOLOv8", "model_type": "object_detection", "loaded": True,
                "device": "cpu", "version": "8.0.0", "total_inference_count": 100,
                "avg_inference_time_ms": 15.2, "error_count": 1,
            },
            {
                "name": "EasyOCR", "model_type": "ocr", "loaded": True,
                "device": "cpu", "version": "1.7.0", "total_inference_count": 80,
                "avg_inference_time_ms": 120.5, "error_count": 0,
            },
            {
                "name": "InsightFace", "model_type": "face_recognition", "loaded": True,
                "device": "cpu", "version": "0.7.3", "total_inference_count": 50,
                "avg_inference_time_ms": 45.0, "error_count": 0,
            },
        ]

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/system/health/models")
            data = resp.json()
            assert data["success"] is True
            assert len(data["data"]["models"]) == 3

            names = [m["name"] for m in data["data"]["models"]]
            assert "YOLOv8" in names
            assert "EasyOCR" in names
            assert "InsightFace" in names


# ────────────────────────────────────────────────────────────────
# Admin-only endpoints
# ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_cleanup_requires_admin():
    from app.models.user import UserRole

    mock_unauthorized = MagicMock(spec=User)
    mock_unauthorized.role = UserRole.SECURITY_OFFICER
    mock_unauthorized.id = "user-1"

    async def override_non_admin():
        return mock_unauthorized

    unauth_app = FastAPI()
    unauth_app.dependency_overrides[get_current_user] = override_non_admin
    unauth_app.include_router(router)

    transport = ASGITransport(app=unauth_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/system/storage/cleanup")
        assert resp.status_code == 403
