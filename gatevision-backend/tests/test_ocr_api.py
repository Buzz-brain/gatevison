from unittest.mock import patch, MagicMock, AsyncMock

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.ocr.routes import router


@pytest.fixture
def app():
    application = FastAPI()
    application.include_router(router)
    return application


def test_routes_import():
    from app.api.v1.ocr.routes import SERVICE, router as r
    assert SERVICE is not None
    assert r is not None


@pytest.mark.asyncio
async def test_get_model_info(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/ocr/model-info")
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_health(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/ocr/health/model")
        assert resp.status_code == 200


@pytest.mark.asyncio
async def test_registry_health(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/ocr/health/registry")
        assert resp.status_code == 200
        data = resp.json()
        assert "health" in data
        assert "summary" in data


@pytest.mark.asyncio
async def test_load_model_requires_auth(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/ocr/load-model")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_history_requires_auth(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/ocr/history")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_search_requires_auth(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/ocr/search?q=ABC")
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
async def test_unload_all_requires_admin(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/ocr/registry/unload-all")
        assert resp.status_code in (401, 403)
