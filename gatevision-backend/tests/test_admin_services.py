from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.admin.dashboard_service import DashboardService
from app.services.admin.reporting_service import ReportingService
from app.services.admin.manual_review_service import (
    ManualReviewError,
    ManualReviewService,
)
from app.services.admin.analytics_service import AnalyticsService
from app.services.admin.export_service import ExportService
from app.services.admin.event_logger import EventLogger


@pytest.fixture(autouse=True)
def mock_models():
    with patch("app.services.admin.event_logger.SystemEvent") as mock_se, \
         patch("app.services.admin.manual_review_service.ManualReview") as mock_mr:
        mock_se.return_value = MagicMock()
        mock_mr.return_value = MagicMock()
        yield


# ── DashboardService ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_dashboard_metrics():
    svc = DashboardService()
    svc._vehicle_profiles.count = AsyncMock(return_value=10)
    svc._driver_profiles.count = AsyncMock(return_value=20)
    svc._sessions.count_inside = AsyncMock(return_value=5)
    svc._transactions.count_by_action = AsyncMock(return_value=3)
    svc._reporting.count_decisions_in_range = AsyncMock(side_effect=[100, 70, 20, 10])
    svc._reporting.get_processing_time_stats = AsyncMock(
        return_value={"avg_processing_time_ms": 45.2, "max_processing_time_ms": 120.0}
    )
    svc._reviews.count_pending = AsyncMock(return_value=3)
    svc._reporting.get_most_active_vehicles = AsyncMock(return_value=[])
    svc._reporting.get_hourly_distribution = AsyncMock(return_value=[])
    svc._reporting.get_daily_trend = AsyncMock(return_value=[])

    data = await svc.get_dashboard()
    metrics = data["metrics"]
    assert metrics["total_vehicles"] == 10
    assert metrics["total_drivers"] == 20
    assert metrics["vehicles_inside"] == 5
    assert metrics["entries_today"] == 3
    assert metrics["grant_count"] == 70
    assert metrics["denial_count"] == 20
    assert metrics["manual_review_count"] == 10
    assert metrics["total_decisions"] == 100
    assert metrics["grant_rate"] == 0.7
    assert metrics["denial_rate"] == 0.2
    assert metrics["manual_review_rate"] == 0.1
    assert metrics["avg_processing_time_ms"] == 45.2
    assert metrics["pending_reviews"] == 3


# ── ReportingService ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_report_activity():
    svc = ReportingService()
    svc._reporting.get_transactions_in_range = AsyncMock(return_value=[])
    svc._reporting.count_transactions_in_range = AsyncMock(return_value=0)

    result = await svc.generate_report(report_type="daily")
    assert result["report_type"] == "daily"
    assert result["total"] == 0


@pytest.mark.asyncio
async def test_generate_report_by_decision():
    svc = ReportingService()
    svc._reporting.get_decisions_in_range = AsyncMock(return_value=[])
    svc._reporting.count_decisions_in_range = AsyncMock(return_value=5)

    result = await svc.generate_report(decision="DENY")
    assert result["report_type"] == "DENY_report"
    assert result["total"] == 5


@pytest.mark.asyncio
async def test_search_by_transaction():
    svc = ReportingService()
    mock_txn = MagicMock()
    mock_txn.transaction_id = "txn-001"
    svc._transactions.get_by_transaction_id = AsyncMock(return_value=mock_txn)
    svc._transactions.get_by_vehicle_id = AsyncMock(return_value=[])

    result = await svc.search(transaction_id="txn-001")
    assert result["total"] == 1
    assert result["results"][0]["type"] == "transaction"


@pytest.mark.asyncio
async def test_search_by_plate():
    svc = ReportingService()
    svc._transactions.get_by_vehicle_id = AsyncMock(return_value=[])

    result = await svc.search(plate="ABC-1234")
    assert result["total"] == 0


@pytest.mark.asyncio
async def test_search_by_request_id():
    svc = ReportingService()
    mock_decision = MagicMock(
        request_id="req-001", decision="GRANT", overall_confidence=0.95,
        explanation="", evidence=[], processing_time=5.0,
    )
    svc._decisions.get_by_request_id = AsyncMock(return_value=mock_decision)

    result = await svc.search(request_id="req-001")
    assert result["total"] == 1
    assert result["results"][0]["type"] == "decision"


# ── ManualReviewService ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_review():
    svc = ManualReviewService()
    mock_review = MagicMock(review_id="rev-001")
    svc._repo.create = AsyncMock(return_value=mock_review)
    svc._events.log_event = AsyncMock()

    review = await svc.create_review(
        request_id="req-001", vehicle_id="ABC-1234",
    )
    assert review.review_id == "rev-001"


@pytest.mark.asyncio
async def test_approve_review():
    svc = ManualReviewService()
    mock_review = MagicMock(
        review_id="rev-001", status="pending",
        reviewer_id=None, reviewed_at=None,
    )
    svc._repo.get_by_review_id = AsyncMock(return_value=mock_review)
    svc._repo.update = AsyncMock(return_value=mock_review)
    svc._events.log_review_action = AsyncMock()

    result = await svc.approve_review(
        review_id="rev-001", reviewer_id="admin-1",
    )
    assert result.status == "approved"
    assert result.outcome == "GRANT"


@pytest.mark.asyncio
async def test_reject_review():
    svc = ManualReviewService()
    mock_review = MagicMock(
        review_id="rev-001", status="pending",
        reviewer_id=None, reviewed_at=None,
    )
    svc._repo.get_by_review_id = AsyncMock(return_value=mock_review)
    svc._repo.update = AsyncMock(return_value=mock_review)
    svc._events.log_review_action = AsyncMock()

    result = await svc.reject_review(
        review_id="rev-001", reviewer_id="admin-1",
    )
    assert result.status == "rejected"
    assert result.outcome == "DENY"


@pytest.mark.asyncio
async def test_approve_review_not_found():
    svc = ManualReviewService()
    svc._repo.get_by_review_id = AsyncMock(return_value=None)

    with pytest.raises(ManualReviewError, match="not found"):
        await svc.approve_review(
            review_id="nonexist", reviewer_id="admin-1",
        )


@pytest.mark.asyncio
async def test_approve_review_already_done():
    svc = ManualReviewService()
    mock_review = MagicMock(review_id="rev-001", status="approved")
    svc._repo.get_by_review_id = AsyncMock(return_value=mock_review)

    with pytest.raises(ManualReviewError, match="already approved"):
        await svc.approve_review(
            review_id="rev-001", reviewer_id="admin-1",
        )


# ── AnalyticsService ────────────────────────────────────────────

@pytest.mark.asyncio
async def test_analytics():
    svc = AnalyticsService()
    svc._reporting.get_hourly_distribution = AsyncMock(return_value=[])
    svc._reporting.get_daily_trend = AsyncMock(return_value=[])
    svc._reporting.count_decisions_in_range = AsyncMock(side_effect=[100, 60, 25, 15])
    svc._reporting.get_processing_time_stats = AsyncMock(
        return_value={"avg_processing_time_ms": 50.0, "max_processing_time_ms": 200.0}
    )
    svc._reporting.get_most_active_vehicles = AsyncMock(return_value=[])

    data = await svc.get_analytics()
    assert data["decision_breakdown"]["total"] == 100
    assert data["decision_breakdown"]["grants"] == 60
    assert data["decision_breakdown"]["denials"] == 25
    assert data["decision_breakdown"]["manual_reviews"] == 15
    assert data["processing_times"]["avg_processing_time_ms"] == 50.0


# ── ExportService ───────────────────────────────────────────────

def test_export_csv():
    data = [
        {"vehicle_id": "ABC-1234", "action": "ENTRY", "count": 5},
        {"vehicle_id": "XYZ-789", "action": "EXIT", "count": 3},
    ]
    result = ExportService.export_csv(data)
    assert "vehicle_id" in result
    assert "ABC-1234" in result
    assert "ENTRY" in result


def test_export_json():
    data = [{"vehicle_id": "ABC-1234", "count": 5}]
    result = ExportService.export_json(data)
    assert '"vehicle_id": "ABC-1234"' in result
    assert '"count": 5' in result


def test_export_csv_empty():
    assert ExportService.export_csv([]) == ""


# ── EventLogger ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_log_event():
    logger = EventLogger()
    mock_event = MagicMock(event_id="evt-001")
    logger._repo.create = AsyncMock(return_value=mock_event)

    event = await logger.log_event(
        event_type="test", description="Test event",
    )
    assert event.event_id == "evt-001"


@pytest.mark.asyncio
async def test_log_user_login():
    logger = EventLogger()
    logger._repo.create = AsyncMock(return_value=MagicMock(event_id="evt-002"))
    result = await logger.log_user_login("user-1")
    assert result.event_id == "evt-002"


@pytest.mark.asyncio
async def test_log_critical_error():
    logger = EventLogger()
    logger._repo.create = AsyncMock(return_value=MagicMock(event_id="evt-003"))
    result = await logger.log_critical_error("System failure")
    assert result.event_id == "evt-003"
