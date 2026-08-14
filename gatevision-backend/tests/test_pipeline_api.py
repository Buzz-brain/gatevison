from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.pipeline.routes import router


@pytest.fixture
def app():
    application = FastAPI()
    application.include_router(router)
    return application


def test_routes_import():
    assert router is not None


@pytest.mark.asyncio
async def test_status(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/pipeline/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "healthy" in data["data"]


@pytest.mark.asyncio
async def test_metrics(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/pipeline/metrics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_request_history_not_found(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/pipeline/request/nonexistent")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_process_upload_invalid_file(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/pipeline/process/upload",
            files={"file": ("test.jpg", b"not-a-real-image", "image/jpeg")},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_process_upload_empty_file(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/pipeline/process/upload",
            files={"file": ("empty.jpg", b"", "image/jpeg")},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_process_upload_corrupt_file(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/pipeline/process/upload",
            files={"file": ("corrupt.jpg", b"\x00\x01\x02\x03\xff\xff", "image/jpeg")},
        )
        assert resp.status_code == 422


@pytest.mark.asyncio
async def test_process_camera_no_camera(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/pipeline/process/camera?camera_id=nonexistent")
        assert resp.status_code == 422
