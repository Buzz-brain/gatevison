from unittest.mock import patch, MagicMock, AsyncMock

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.plate_detection.routes import router


@pytest.fixture
def app():
    application = FastAPI()
    application.include_router(router)
    return application


@pytest.fixture
def auth_header():
    return {"Authorization": "Bearer faketoken"}


@pytest.mark.asyncio
async def test_get_model_info_unauthenticated(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/plate-detection/model-info")
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_model_health(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/plate-detection/health/model")
        assert resp.status_code == 200


def test_routes_import():
    from app.api.v1.plate_detection.routes import SERVICE, router as r
    assert SERVICE is not None
    assert r is not None
