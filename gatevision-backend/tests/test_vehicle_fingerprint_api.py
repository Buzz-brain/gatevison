from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.vehicle.routes import router, SERVICE


@pytest.fixture(autouse=True)
def mock_deps():
    SERVICE._repository = MagicMock()
    SERVICE._repository.find_by_plate = AsyncMock(return_value=None)
    SERVICE._repository.delete_by_plate = AsyncMock(return_value=True)
    SERVICE._repository.get_all = AsyncMock(return_value=[])


@pytest.fixture
def app():
    application = FastAPI()
    application.include_router(router)
    return application


def test_routes_import():
    assert router is not None


@pytest.mark.asyncio
async def test_model_info(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/vehicle/model-info")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_health(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/vehicle/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_store_fingerprint(app):
    transport = ASGITransport(app=app)
    mock_record = MagicMock()
    mock_record.id = "rec1"
    mock_record.plate_text = "ABC-1234"
    mock_record.dimension = 2048
    SERVICE.store_fingerprint = AsyncMock(return_value=mock_record)

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/vehicle/store",
            params={
                "plate_text": "ABC-1234",
                "embedding": [0.1, 0.2, 0.3],
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["plate_text"] == "ABC-1234"


@pytest.mark.asyncio
async def test_delete_fingerprint(app):
    transport = ASGITransport(app=app)
    SERVICE.delete_fingerprint = AsyncMock(return_value=True)

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.delete(
            "/vehicle/fingerprint",
            params={"plate_text": "ABC-1234"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_delete_fingerprint_not_found(app):
    transport = ASGITransport(app=app)
    SERVICE.delete_fingerprint = AsyncMock(return_value=False)

    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.delete(
            "/vehicle/fingerprint",
            params={"plate_text": "NONEXIST"},
        )
        assert resp.status_code == 404
