import logging
from datetime import datetime, timezone
from typing import Optional

from app.models.decision_record import DecisionRecord
from app.repositories.decision_repository import DecisionRepository
from app.repositories.driver_profile_repository import DriverProfileRepository
from app.repositories.gate_session_repository import GateSessionRepository
from app.repositories.gate_transaction_repository import (
    GateTransactionRepository,
)
from app.repositories.manual_review_repository import ManualReviewRepository
from app.repositories.reporting_repository import ReportingRepository
from app.repositories.vehicle_profile_repository import VehicleProfileRepository

logger = logging.getLogger(__name__)


class DashboardService:
    def __init__(self):
        self._vehicle_profiles = VehicleProfileRepository()
        self._driver_profiles = DriverProfileRepository()
        self._sessions = GateSessionRepository()
        self._transactions = GateTransactionRepository()
        self._decisions = DecisionRepository()
        self._reviews = ManualReviewRepository()
        self._reporting = ReportingRepository()

    async def get_dashboard(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> dict:
        if not end_date:
            end_date = datetime.now(timezone.utc)
        if not start_date:
            from datetime import timedelta
            start_date = end_date - timedelta(days=30)

        total_vehicles = await self._vehicle_profiles.count()
        total_drivers = await self._driver_profiles.count()
        vehicles_inside = await self._sessions.count_inside()

        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0,
        )
        entries_today = await self._transactions.count_by_action("ENTRY")
        exits_today = await self._transactions.count_by_action("EXIT")

        # decision stats in date range
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

        grant_rate = round(grants / total_decisions, 4) if total_decisions else 0.0
        denial_rate = round(denials / total_decisions, 4) if total_decisions else 0.0
        review_rate = round(reviews / total_decisions, 4) if total_decisions else 0.0

        processing_stats = await self._reporting.get_processing_time_stats(
            start_date, end_date,
        )
        pending_reviews = await self._reviews.count_pending()

        most_active = await self._reporting.get_most_active_vehicles(
            start_date, end_date, limit=10,
        )
        hourly = await self._reporting.get_hourly_distribution(
            start_date, end_date,
        )
        daily_trend = await self._reporting.get_daily_trend(
            start_date, end_date,
        )

        return {
            "metrics": {
                "total_vehicles": total_vehicles,
                "total_drivers": total_drivers,
                "vehicles_inside": vehicles_inside,
                "entries_today": entries_today,
                "exits_today": exits_today,
                "grant_count": grants,
                "denial_count": denials,
                "manual_review_count": reviews,
                "total_decisions": total_decisions,
                "grant_rate": grant_rate,
                "denial_rate": denial_rate,
                "manual_review_rate": review_rate,
                "avg_processing_time_ms": processing_stats["avg_processing_time_ms"],
                "pending_reviews": pending_reviews,
            },
            "most_active_vehicles": [
                {"vehicle_id": v["_id"], "count": v["count"]}
                for v in most_active
            ],
            "peak_entry_hours": [
                {"hour": h["_id"], "count": h["count"]}
                for h in hourly
            ],
            "daily_trend": daily_trend,
        }
