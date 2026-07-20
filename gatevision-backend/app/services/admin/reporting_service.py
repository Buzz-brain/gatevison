import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.repositories.decision_repository import DecisionRepository
from app.repositories.driver_profile_repository import DriverProfileRepository
from app.repositories.gate_transaction_repository import (
    GateTransactionRepository,
)
from app.repositories.manual_review_repository import ManualReviewRepository
from app.repositories.reporting_repository import ReportingRepository
from app.repositories.vehicle_profile_repository import VehicleProfileRepository

logger = logging.getLogger(__name__)


class ReportingService:
    def __init__(self):
        self._reporting = ReportingRepository()
        self._transactions = GateTransactionRepository()
        self._decisions = DecisionRepository()
        self._reviews = ManualReviewRepository()
        self._vehicles = VehicleProfileRepository()
        self._drivers = DriverProfileRepository()

    async def generate_report(
        self,
        report_type: str = "daily",
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        action: Optional[str] = None,
        decision: Optional[str] = None,
        vehicle_id: Optional[str] = None,
        driver_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> dict:
        if not end_date:
            end_date = datetime.now(timezone.utc)
        if not start_date:
            periods = {"daily": 1, "weekly": 7, "monthly": 30}
            days = periods.get(report_type, 30)
            start_date = end_date - timedelta(days=days)

        if vehicle_id:
            txns = await self._transactions.get_by_vehicle_id(
                vehicle_id, skip=skip, limit=limit,
            )
            return {
                "report_type": report_type,
                "total": len(txns),
                "results": [self._txn_to_dict(t) for t in txns],
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            }

        if driver_id:
            txns = await self._transactions.get_all(
                skip=skip, limit=limit,
            )
            return {
                "report_type": report_type,
                "total": len(txns),
                "results": [self._txn_to_dict(t) for t in txns],
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            }

        if decision:
            records = await self._reporting.get_decisions_in_range(
                start_date, end_date,
                decision=decision, skip=skip, limit=limit,
            )
            total = await self._reporting.count_decisions_in_range(
                start_date, end_date, decision=decision,
            )
            return {
                "report_type": f"{decision}_report",
                "total": total,
                "results": [self._decision_to_dict(r) for r in records],
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            }

        txns = await self._reporting.get_transactions_in_range(
            start_date, end_date,
            action=action, skip=skip, limit=limit,
        )
        total = await self._reporting.count_transactions_in_range(
            start_date, end_date, action=action,
        )

        return {
            "report_type": report_type,
            "total": total,
            "results": [self._txn_to_dict(t) for t in txns],
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }

    async def search(
        self,
        plate: Optional[str] = None,
        driver_name: Optional[str] = None,
        decision_type: Optional[str] = None,
        transaction_id: Optional[str] = None,
        request_id: Optional[str] = None,
        gate_name: Optional[str] = None,
        state: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> dict:
        results = []

        if transaction_id:
            txn = await self._transactions.get_by_transaction_id(transaction_id)
            if txn:
                results.append({
                    "type": "transaction",
                    "data": self._txn_to_dict(txn),
                })
            return {"total": len(results), "results": results}

        if request_id:
            decision = await self._decisions.get_by_request_id(request_id)
            if decision:
                results.append({
                    "type": "decision",
                    "data": self._decision_to_dict(decision),
                })
            return {"total": len(results), "results": results}

        if plate:
            txns = await self._transactions.get_by_vehicle_id(
                plate, skip=skip, limit=limit,
            )
            results = [
                {"type": "transaction", "data": self._txn_to_dict(t)}
                for t in txns
            ]
            return {"total": len(results), "results": results}

        if decision_type:
            records = await self._decisions.get_all(skip=skip, limit=limit)
            filtered = [r for r in records if r.decision == decision_type.upper()]
            results = [
                {"type": "decision", "data": self._decision_to_dict(r)}
                for r in filtered
            ]
            return {"total": len(results), "results": results}

        txns = await self._transactions.get_all(skip=skip, limit=limit)
        results = [
            {"type": "transaction", "data": self._txn_to_dict(t)}
            for t in txns
        ]
        return {"total": len(results), "results": results}

    @staticmethod
    def _txn_to_dict(txn) -> dict:
        return {
            "transaction_id": txn.transaction_id,
            "session_id": txn.session_id,
            "vehicle_id": txn.vehicle_id,
            "driver_id": txn.driver_id,
            "action": txn.action,
            "decision": txn.decision,
            "timestamp": txn.timestamp.isoformat(),
            "request_id": txn.request_id,
            "gate_name": txn.gate_name,
            "notes": txn.notes,
        }

    @staticmethod
    def _decision_to_dict(rec) -> dict:
        return {
            "request_id": rec.request_id,
            "decision": rec.decision,
            "overall_confidence": rec.overall_confidence,
            "explanation": rec.explanation,
            "evidence": rec.evidence,
            "processing_time": rec.processing_time,
            "created_at": rec.created_at.isoformat(),
        }
