from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.face.routes import router, SERVICE
from app.services.admin.enrollment_service import EnrollmentError


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


@pytest.mark.asyncio
async def test_enroll(app):
    mock_enroll = AsyncMock(return_value={
        "driver_id": "DRV-001",
        "full_name": "Test Driver",
        "face_embedding_dimension": 512,
    })
    svc = MagicMock()
    svc.enroll_driver_with_image = mock_enroll
    with patch(
        "app.api.v1.face.routes.EnrollmentService", return_value=svc,
    ), patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=np.zeros((100, 100, 3), dtype=np.uint8),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post(
                "/face/enroll",
                data={"driver_id": "DRV-001", "full_name": "Test Driver"},
                files={"file": ("face.jpg", b"fakedata", "image/jpeg")},
            )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["data"]["face_embedding_dimension"] == 512
    mock_enroll.assert_awaited_once()


@pytest.mark.asyncio
async def test_enroll_no_face_error(app):
    svc = MagicMock()
    svc.enroll_driver_with_image = AsyncMock(
        side_effect=EnrollmentError("No face detected in image")
    )
    with patch(
        "app.api.v1.face.routes.EnrollmentService", return_value=svc,
    ), patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=np.zeros((100, 100, 3), dtype=np.uint8),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post(
                "/face/enroll",
                data={"driver_id": "DRV-002", "full_name": "No Face"},
                files={"file": ("face.jpg", b"fakedata", "image/jpeg")},
            )
    assert resp.status_code == 400
