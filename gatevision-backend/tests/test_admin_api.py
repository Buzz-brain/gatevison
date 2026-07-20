from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.admin.routes import (
    ANALYTICS_SVC,
    AUDIT_SVC,
    DASHBOARD_SVC,
    EVENTS,
    EXPORT_SVC,
    REPORTING_SVC,
    REVIEW_SVC,
    router,
)


@pytest.fixture(autouse=True)
def mock_beanie_models():
    with patch("app.services.admin.event_logger.SystemEvent") as mock_se, \
         patch("app.services.admin.manual_review_service.ManualReview") as mock_mr:
        mock_se.return_value = MagicMock(event_id="evt-auto")
        mock_mr.return_value = MagicMock(review_id="rev-auto")
        yield


@pytest.fixture(autouse=True)
def mock_all():
    DASHBOARD_SVC.get_dashboard = AsyncMock(
        return_value={
            "metrics": {
                "total_vehicles": 10, "total_drivers": 20, "vehicles_inside": 5,
                "entries_today": 3, "exits_today": 2,
                "grant_count": 70, "denial_count": 20, "manual_review_count": 10,
                "total_decisions": 100, "grant_rate": 0.7, "denial_rate": 0.2,
                "manual_review_rate": 0.1, "avg_processing_time_ms": 45.2,
                "pending_reviews": 3,
            },
            "most_active_vehicles": [],
            "peak_entry_hours": [],
            "daily_trend": [],
        }
    )
    REPORTING_SVC.generate_report = AsyncMock(
        return_value={
            "report_type": "daily", "total": 5,
            "results": [{"vehicle_id": "ABC-1234", "action": "ENTRY"}],
        }
    )
    REPORTING_SVC.search = AsyncMock(
        return_value={
            "total": 1,
            "results": [{"type": "transaction", "data": {"transaction_id": "txn-001"}}],
        }
    )
    ANALYTICS_SVC.get_analytics = AsyncMock(
        return_value={
            "hourly_traffic": [],
            "daily_trend": [],
            "decision_breakdown": {
                "total": 100, "grants": 70, "denials": 20, "manual_reviews": 10,
            },
            "processing_times": {},
            "top_denied_vehicles": [],
        }
    )
    AUDIT_SVC.get_events = AsyncMock(
        return_value={
            "total": 2,
            "results": [
                {"event_id": "evt-001", "event_type": "user_login", "severity": "info"},
            ],
        }
    )
    REVIEW_SVC.get_all_reviews = AsyncMock(return_value=[])
    REVIEW_SVC.count_pending = AsyncMock(return_value=0)
    REVIEW_SVC.approve_review = AsyncMock(
        return_value=MagicMock(
            review_id="rev-001", status="approved", outcome="GRANT",
            reviewer_id="admin-1",
            reviewed_at=MagicMock(isoformat=MagicMock(return_value="2024-01-01T00:00:00")),
        )
    )
    REVIEW_SVC.reject_review = AsyncMock(
        return_value=MagicMock(
            review_id="rev-001", status="rejected", outcome="DENY",
            reviewer_id="admin-1",
            reviewed_at=MagicMock(isoformat=MagicMock(return_value="2024-01-01T00:00:00")),
        )
    )
    EXPORT_SVC.export_report = AsyncMock(
        return_value=("col1,col2\nv1,v2\n", "report.csv", "text/csv")
    )
    EVENTS.log_event = AsyncMock(
        return_value=MagicMock(
            event_id="evt-test",
            event_type="test",
            severity="info",
            source="admin",
            description="Test",
            created_at=MagicMock(
                isoformat=MagicMock(return_value="2024-01-01T00:00:00")
            ),
        )
    )


@pytest.fixture
def app():
    application = FastAPI()
    application.include_router(router)
    return application


def test_routes_import():
    assert router is not None


# ── Dashboard ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_dashboard(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/admin/dashboard")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["metrics"]["total_vehicles"] == 10
        assert data["data"]["metrics"]["grant_rate"] == 0.7


# ── Reports ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_reports(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/admin/reports?report_type=daily")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["report_type"] == "daily"


# ── Search ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_search(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/admin/search?plate=ABC-1234")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["total"] == 1


# ── Analytics ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_analytics(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/admin/analytics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["decision_breakdown"]["total"] == 100


# ── Events ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_events(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/admin/events")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["total"] == 2


@pytest.mark.asyncio
async def test_create_event(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/admin/events?event_type=test&description=Test&severity=info&source=admin"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


# ── Manual Reviews ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_manual_reviews(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/admin/manual-reviews")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_approve_review(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/admin/manual-review/rev-001/approve?reviewer_id=admin-1"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["status"] == "approved"
        assert data["data"]["outcome"] == "GRANT"


@pytest.mark.asyncio
async def test_reject_review(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/admin/manual-review/rev-001/reject?reviewer_id=admin-1"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["status"] == "rejected"
        assert data["data"]["outcome"] == "DENY"


# ── Export ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_export_csv(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/admin/export?format=csv")
        assert resp.status_code == 200
        assert resp.headers.get("content-disposition", "").startswith("attachment")


@pytest.mark.asyncio
async def test_export_json(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        EXPORT_SVC.export_report = AsyncMock(
            return_value=('{"key": "val"}', "report.json", "application/json")
        )
        resp = await ac.get("/admin/export?format=json")
        assert resp.status_code == 200
        assert "json" in resp.headers.get("content-disposition", "")
