from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.system.routes import router, get_current_user
from app.models.user import User, UserRole


MOCK_USER = MagicMock(spec=User)
MOCK_USER.id = "admin-1"
MOCK_USER.role = UserRole.ADMIN
MOCK_USER.email = "admin@test.com"
MOCK_USER.first_name = "Admin"
MOCK_USER.last_name = "User"


async def override_get_current_user():
    return MOCK_USER


@pytest.fixture(autouse=True)
def mock_services():
    with patch("app.api.v1.system.routes.health_service") as h, \
         patch("app.api.v1.system.routes.model_monitor_service") as mm, \
         patch("app.api.v1.system.routes.performance_service") as p, \
         patch("app.api.v1.system.routes.configuration_service") as c, \
         patch("app.api.v1.system.routes.version_service") as v, \
         patch("app.api.v1.system.routes.system_storage_service") as s, \
         patch("app.api.v1.system.routes.cleanup_service") as cl, \
         patch("app.api.v1.system.routes.backup_service") as b, \
         patch("app.api.v1.system.routes.monitoring_service") as mo:

        h.check_health = AsyncMock(return_value={
            "overall_status": "healthy",
            "components": {
                "app": {"healthy": True, "status": "healthy", "message": "OK"},
                "storage": {"healthy": True, "status": "healthy", "message": "Storage OK"},
                "mongodb": {"healthy": True, "status": "healthy", "message": "OK"},
            },
            "checked_at": "2024-01-01T00:00:00",
        })
        h.check_database_health = AsyncMock(return_value={
            "healthy": True, "status": "connected", "details": {},
        })

        mm.get_all_model_infos.return_value = [
            {"name": "YOLOv8", "loaded": True, "device": "cpu", "version": "8.0.0"},
        ]
        mm.get_model_detail.return_value = {
            "name": "YOLOv8", "loaded": True, "device": "cpu", "version": "8.0.0",
            "total_inference_count": 10, "avg_inference_time_ms": 5.0,
        }

        p.get_performance_metrics.return_value = {
            "avg_pipeline_execution_time_ms": 50.0,
            "total_processed_requests": 100,
            "failed_requests": 5,
            "pipeline_success_rate": 95.0,
            "avg_stage_times_ms": {"detect": 10.0},
        }

        c.get_configuration.return_value = {"decision_weights": {}}
        c.validate_configuration.return_value = []

        v.get_version_info.return_value = {
            "system_name": "GateVision API", "version": "1.0.0",
            "python_version": "3.10", "fastapi_version": "0.100.0",
            "ai_libraries": {},
        }

        s.get_storage_info = AsyncMock(return_value={
            "upload_directory_size_bytes": 1024,
            "total_images": 10,
            "images_by_category": {},
            "orphaned_files": 0,
            "available_disk_space_bytes": 1000000,
        })

        cl.cleanup = AsyncMock(return_value={
            "deleted_files": 5,
            "deleted_temp_files": 3,
            "deleted_empty_dirs": 2,
            "freed_bytes": 1024,
        })

        b.export_database = AsyncMock(return_value={
            "success": True, "message": "Exported", "filename": "backup.json",
            "collections": ["users"], "record_count": 10, "size_bytes": 500,
        })
        b.export_configuration = AsyncMock(return_value={
            "success": True, "message": "Config exported", "filename": "config.json",
            "collections": ["configuration"], "record_count": 1, "size_bytes": 200,
        })
        b.import_database = AsyncMock(return_value={
            "success": True, "message": "Imported",
            "collections_imported": ["users"], "total_records": 10, "errors": [],
        })
        b.list_backups.return_value = [
            {"filename": "backup.json", "size_bytes": 500, "created_at": "2024-01-01T00:00:00"},
        ]

        mo.get_log_statistics = AsyncMock(return_value={
            "total_events": 50,
            "event_types": {"user_login": 30},
            "severity_counts": {"info": 40, "error": 10},
            "recent_events": 10,
            "errors_last_24h": 2,
        })

        yield


@pytest.fixture
def app():
    application = FastAPI()
    application.dependency_overrides[get_current_user] = override_get_current_user
    application.include_router(router)
    return application


@pytest.mark.asyncio
async def test_get_system_health(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["overall_status"] == "healthy"


@pytest.mark.asyncio
async def test_get_model_health(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/health/models")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert len(data["data"]["models"]) == 1


@pytest.mark.asyncio
async def test_get_model_detail(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/health/models/YOLOv8")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["name"] == "YOLOv8"


@pytest.mark.asyncio
async def test_get_model_detail_not_found(app):
    with patch("app.api.v1.system.routes.model_monitor_service.get_model_detail") as mock_get:
        mock_get.return_value = None
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/system/health/models/Unknown")
            assert resp.status_code == 200
            data = resp.json()
            assert data["success"] is False


@pytest.mark.asyncio
async def test_get_database_health(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/health/database")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_get_storage_health(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/health/storage")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_get_performance(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/performance")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["total_processed_requests"] == 100


@pytest.mark.asyncio
async def test_get_configuration(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/configuration")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "settings" in data["data"]


@pytest.mark.asyncio
async def test_get_version(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/version")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["system_name"] == "GateVision API"


@pytest.mark.asyncio
async def test_get_storage_info(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/storage")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_cleanup_storage(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/system/storage/cleanup")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["deleted_files"] == 5


@pytest.mark.asyncio
async def test_backup_export_database(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/system/backup/export",
            json={"backup_type": "database", "collections": ["users"]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_backup_export_configuration(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/system/backup/export",
            json={"backup_type": "configuration"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_backup_import(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/system/backup/import",
            json={"filename": "backup.json"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_list_backups(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/backups")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert len(data["data"]["backups"]) == 1


@pytest.mark.asyncio
async def test_get_log_statistics(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/system/logs/statistics?hours=48")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["total_events"] == 50
