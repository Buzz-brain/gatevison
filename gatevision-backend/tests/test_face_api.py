from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.face.routes import router, SERVICE


@pytest.fixture(autouse=True)
def mock_repo():
    repo = MagicMock()
    repo.get_recent = AsyncMock()
    repo.get_recent.return_value = []
    repo.get_by_id = AsyncMock()
    repo.get_by_id.return_value = None
    SERVICE.repository = repo


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
        resp = await ac.get("/face/model-info")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_health(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/face/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_history(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/face/history")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_get_record_not_found(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/face/nonexistent")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_compare(app):
    transport = ASGITransport(app=app)
    emb = [0.1] * 512
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/face/compare?metric=cosine",
            json={"embedding_a": emb, "embedding_b": emb},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["is_match"] is True


@pytest.mark.asyncio
async def test_compare_invalid_metric(app):
    transport = ASGITransport(app=app)
    emb = [0.1] * 512
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/face/compare?metric=bad",
            json={"embedding_a": emb, "embedding_b": emb},
        )
        assert resp.status_code == 400
