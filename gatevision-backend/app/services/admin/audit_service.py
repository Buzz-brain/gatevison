import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.repositories.reporting_repository import ReportingRepository
from app.repositories.system_event_repository import SystemEventRepository
from app.repositories.manual_review_repository import ManualReviewRepository

logger = logging.getLogger(__name__)


class AdminAuditService:
    def __init__(self):
        self._reporting = ReportingRepository()
        self._events = SystemEventRepository()
        self._reviews = ManualReviewRepository()

    async def get_events(
        self,
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
        source: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> dict:
        if not end_date:
            end_date = datetime.now(timezone.utc)
        if not start_date:
            start_date = end_date - timedelta(days=7)

        events = await self._reporting.get_events_in_range(
            start_date, end_date,
            event_type=event_type,
            severity=severity,
            skip=skip, limit=limit,
        )
        total = await self._events.count(
            event_type=event_type, severity=severity,
        )

        return {
            "total": total,
            "results": [self._event_to_dict(e) for e in events],
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }

    async def get_error_summary(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        if not end_date:
            end_date = datetime.now(timezone.utc)
        if not start_date:
            start_date = end_date - timedelta(days=7)

        critical = await self._events.count(
            severity="critical",
        )
        warnings = await self._events.count(
            severity="warning",
        )

        return {
            "critical_errors": critical,
            "warnings": warnings,
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat(),
        }

    @staticmethod
    def _event_to_dict(event) -> dict:
        return {
            "event_id": event.event_id,
            "event_type": event.event_type,
            "severity": event.severity,
            "source": event.source,
            "description": event.description,
            "metadata": event.metadata,
            "created_at": event.created_at.isoformat(),
        }
