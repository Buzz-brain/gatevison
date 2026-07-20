import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.services.admin.analytics_service import AnalyticsService
from app.services.admin.audit_service import AdminAuditService
from app.services.admin.dashboard_service import DashboardService
from app.services.admin.event_logger import EventLogger
from app.services.admin.export_service import ExportService
from app.services.admin.manual_review_service import (
    ManualReviewError,
    ManualReviewService,
)
from app.services.admin.reporting_service import ReportingService
from fastapi.responses import PlainTextResponse, Response

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["Admin"])

DASHBOARD_SVC = DashboardService()
REPORTING_SVC = ReportingService()
REVIEW_SVC = ManualReviewService()
AUDIT_SVC = AdminAuditService()
ANALYTICS_SVC = AnalyticsService()
EXPORT_SVC = ExportService()
EVENTS = EventLogger()


def _parse_date(date_str: Optional[str]) -> Optional[datetime]:
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format: '{date_str}'. Use ISO format.",
        )


@router.get("/dashboard")
async def get_dashboard(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    try:
        data = await DASHBOARD_SVC.get_dashboard(
            start_date=_parse_date(start_date),
            end_date=_parse_date(end_date),
        )
        return {"success": True, "message": "Dashboard data retrieved", "data": data}
    except Exception as e:
        logger.exception("Dashboard error")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports")
async def get_reports(
    report_type: str = Query("daily"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
    vehicle_id: Optional[str] = Query(None),
    driver_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    try:
        data = await REPORTING_SVC.generate_report(
            report_type=report_type,
            start_date=_parse_date(start_date),
            end_date=_parse_date(end_date),
            action=action,
            decision=decision,
            vehicle_id=vehicle_id,
            driver_id=driver_id,
            skip=skip,
            limit=limit,
        )
        return {"success": True, "message": "Report generated", "data": data}
    except Exception as e:
        logger.exception("Report error")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search(
    plate: Optional[str] = Query(None),
    driver_name: Optional[str] = Query(None),
    decision_type: Optional[str] = Query(None),
    transaction_id: Optional[str] = Query(None),
    request_id: Optional[str] = Query(None),
    gate_name: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    try:
        data = await REPORTING_SVC.search(
            plate=plate,
            driver_name=driver_name,
            decision_type=decision_type,
            transaction_id=transaction_id,
            request_id=request_id,
            gate_name=gate_name,
            state=state,
            skip=skip,
            limit=limit,
        )
        return {"success": True, "message": "Search completed", "data": data}
    except Exception as e:
        logger.exception("Search error")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics")
async def get_analytics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    try:
        data = await ANALYTICS_SVC.get_analytics(
            start_date=_parse_date(start_date),
            end_date=_parse_date(end_date),
        )
        return {"success": True, "message": "Analytics retrieved", "data": data}
    except Exception as e:
        logger.exception("Analytics error")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events")
async def get_events(
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    try:
        data = await AUDIT_SVC.get_events(
            event_type=event_type,
            severity=severity,
            source=source,
            start_date=_parse_date(start_date),
            end_date=_parse_date(end_date),
            skip=skip,
            limit=limit,
        )
        return {"success": True, "message": "Events retrieved", "data": data}
    except Exception as e:
        logger.exception("Events error")
        raise HTTPException(status_code=500, detail=str(e))


# ── Manual Reviews ──────────────────────────────────────────────

@router.get("/manual-reviews")
async def list_manual_reviews(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    try:
        reviews = await REVIEW_SVC.get_all_reviews(
            status=status, skip=skip, limit=limit,
        )
        return {
            "success": True,
            "message": "Manual reviews retrieved",
            "data": {
                "results": [
                    {
                        "review_id": r.review_id,
                        "request_id": r.request_id,
                        "vehicle_id": r.vehicle_id,
                        "driver_id": r.driver_id,
                        "status": r.status,
                        "outcome": r.outcome,
                        "reviewer_id": r.reviewer_id,
                        "reviewer_notes": r.reviewer_notes,
                        "reviewed_at": (
                            r.reviewed_at.isoformat() if r.reviewed_at else None
                        ),
                        "created_at": r.created_at.isoformat(),
                    }
                    for r in reviews
                ],
                "total": len(reviews),
                "pending_count": await REVIEW_SVC.count_pending(),
            },
        }
    except Exception as e:
        logger.exception("List reviews error")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/manual-review/{review_id}/approve")
async def approve_review(
    review_id: str,
    reviewer_id: str = Query(...),
    notes: Optional[str] = Query(None),
):
    try:
        review = await REVIEW_SVC.approve_review(
            review_id=review_id,
            reviewer_id=reviewer_id,
            notes=notes,
        )
        return {
            "success": True,
            "message": "Review approved",
            "data": {
                "review_id": review.review_id,
                "status": review.status,
                "outcome": review.outcome,
                "reviewer_id": review.reviewer_id,
                "reviewed_at": review.reviewed_at.isoformat()
                if review.reviewed_at else None,
            },
        }
    except ManualReviewError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Approve review error")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/manual-review/{review_id}/reject")
async def reject_review(
    review_id: str,
    reviewer_id: str = Query(...),
    notes: Optional[str] = Query(None),
):
    try:
        review = await REVIEW_SVC.reject_review(
            review_id=review_id,
            reviewer_id=reviewer_id,
            notes=notes,
        )
        return {
            "success": True,
            "message": "Review rejected",
            "data": {
                "review_id": review.review_id,
                "status": review.status,
                "outcome": review.outcome,
                "reviewer_id": review.reviewer_id,
                "reviewed_at": review.reviewed_at.isoformat()
                if review.reviewed_at else None,
            },
        }
    except ManualReviewError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Reject review error")
        raise HTTPException(status_code=500, detail=str(e))


# ── Export ───────────────────────────────────────────────────────

@router.get("/export")
async def export_data(
    format: str = Query("csv", pattern="^(csv|json|xlsx)$"),
    report_type: str = Query("daily"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
):
    try:
        report = await REPORTING_SVC.generate_report(
            report_type=report_type,
            start_date=_parse_date(start_date),
            end_date=_parse_date(end_date),
            decision=decision,
        )
        results = report.get("results", [])
        content, filename, content_type = await EXPORT_SVC.export_report(
            data=results, export_format=format,
        )

        if isinstance(content, bytes):
            return Response(
                content=content,
                media_type=content_type,
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )
        return PlainTextResponse(
            content=content,
            media_type=content_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except ImportError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Export error")
        raise HTTPException(status_code=500, detail=str(e))


# ── Events (manual) ─────────────────────────────────────────────

@router.post("/events")
async def create_event(
    event_type: str = Query(...),
    description: str = Query(...),
    severity: str = Query("info"),
    source: str = Query("admin"),
):
    try:
        event = await EVENTS.log_event(
            event_type=event_type,
            description=description,
            severity=severity,
            source=source,
        )
        return {
            "success": True,
            "message": "Event created",
            "data": {
                "event_id": event.event_id,
                "event_type": event.event_type,
                "severity": event.severity,
                "source": event.source,
                "description": event.description,
                "created_at": event.created_at.isoformat(),
            },
        }
    except Exception as e:
        logger.exception("Create event error")
        raise HTTPException(status_code=500, detail=str(e))
