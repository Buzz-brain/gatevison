from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.decision.routes import ENGINE, REPO, router
from app.services.decision.rule_engine import Decision


@pytest.fixture(autouse=True)
def mock_repo():
    REPO.create = AsyncMock(return_value=MagicMock())
    REPO.get_by_id = AsyncMock(return_value=None)
    REPO.get_by_request_id = AsyncMock(return_value=None)
    REPO.get_all = AsyncMock(return_value=[])
    REPO.count = AsyncMock(return_value=0)
    REPO.statistics = AsyncMock(
        return_value={
            "total_decisions": 0,
            "grants": 0,
            "denials": 0,
            "manual_reviews": 0,
            "grant_rate": 0.0,
        }
    )
    # Mock DecisionRecord to prevent Beanie initialization
    with patch("app.api.v1.decision.routes.DecisionRecord") as mock_dr:
        mock_dr.return_value = MagicMock()
        yield
    # Restore ENGINE after test
    from app.services.decision.decision_engine import DecisionEngine
    from app.api.v1.decision.routes import ENGINE as eng
    # (re-imported at module level anyway)


@pytest.fixture
def app():
    application = FastAPI()
    application.include_router(router)
    return application


def test_routes_import():
    assert router is not None


@pytest.mark.asyncio
async def test_evaluate(app):
    transport = ASGITransport(app=app)
    payload = [
        {
            "module_name": "plate_detection",
            "confidence": 0.95,
            "matched": True,
            "score": 0.95,
        },
        {
            "module_name": "ocr", "confidence": 0.9, "matched": True, "score": 0.9,
        },
        {
            "module_name": "face_recognition",
            "confidence": 0.88, "matched": True, "score": 0.88,
        },
        {
            "module_name": "vehicle_fingerprint",
            "confidence": 1.0, "matched": True,
        },
    ]
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/decision/evaluate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["decision"] == "GRANT"


@pytest.mark.asyncio
async def test_evaluate_deny(app):
    transport = ASGITransport(app=app)
    payload = [
        {
            "module_name": "plate_detection",
            "confidence": 0.0, "matched": False,
        },
    ]
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/decision/evaluate", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["data"]["decision"] == "DENY"


@pytest.mark.asyncio
async def test_evaluate_invalid_module(app):
    transport = ASGITransport(app=app)
    payload = [
        {
            "module_name": "unknown_module",
            "confidence": 0.9, "matched": True,
        },
    ]
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/decision/evaluate", json=payload)
        assert resp.status_code == 400


@pytest.mark.asyncio
async def test_get_decision_not_found(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/decision/nonexist")
        assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_decision_found(app):
    mock_record = MagicMock()
    mock_record.id = "rec-1"
    mock_record.request_id = "req-1"
    mock_record.decision = "GRANT"
    mock_record.overall_confidence = 0.92
    mock_record.explanation = "Access Granted."
    mock_record.evidence = []
    mock_record.fusion_breakdown = {}
    mock_record.triggered_rules = []
    mock_record.processing_time = 10.0
    mock_record.created_at = "2024-01-01T00:00:00"
    REPO.get_by_id = AsyncMock(return_value=mock_record)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/decision/rec-1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["decision"] == "GRANT"


@pytest.mark.asyncio
async def test_history(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/decision/history")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "results" in data["data"]


@pytest.mark.asyncio
async def test_statistics(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/decision/statistics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["total_decisions"] == 0


@pytest.mark.asyncio
async def test_rules(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/decision/rules")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "weights" in data["data"]
        assert "thresholds" in data["data"]
