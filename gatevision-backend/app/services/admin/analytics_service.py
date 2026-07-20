import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.repositories.decision_repository import DecisionRepository
from app.repositories.reporting_repository import ReportingRepository

logger = logging.getLogger(__name__)


class AnalyticsService:
    def __init__(self):
        self._reporting = ReportingRepository()
        self._decisions = DecisionRepository()

    async def get_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        if not end_date:
            end_date = datetime.now(timezone.utc)
        if not start_date:
            start_date = end_date - timedelta(days=30)

        hourly = await self._reporting.get_hourly_distribution(
            start_date, end_date,
        )
        daily_trend = await self._reporting.get_daily_trend(
            start_date, end_date,
        )

        total_decisions = await self._reporting.count_decisions_in_range(
            start_date, end_date,
        )
        grants = await self._reporting.count_decisions_in_range(
            start_date, end_date, decision="GRANT",
        )
        denials = await self._reporting.count_decisions_in_range(
            start_date, end_date, decision="DENY",
        )
        reviews = await self._reporting.count_decisions_in_range(
            start_date, end_date, decision="MANUAL_REVIEW",
        )

        processing = await self._reporting.get_processing_time_stats(
            start_date, end_date,
        )

        top_denied = await self._reporting.get_most_active_vehicles(
            start_date, end_date, limit=10,
        )

        return {
            "hourly_traffic": [
                {"hour": h["_id"], "count": h["count"]}
                for h in hourly
            ],
            "daily_trend": daily_trend,
            "decision_breakdown": {
                "total": total_decisions,
                "grants": grants,
                "denials": denials,
                "manual_reviews": reviews,
                "grant_rate": round(grants / total_decisions, 4) if total_decisions else 0.0,
                "denial_rate": round(denials / total_decisions, 4) if total_decisions else 0.0,
                "review_rate": round(reviews / total_decisions, 4) if total_decisions else 0.0,
            },
            "processing_times": processing,
            "top_denied_vehicles": [
                {"vehicle_id": v["_id"], "count": v["count"]}
                for v in top_denied
            ],
        }
