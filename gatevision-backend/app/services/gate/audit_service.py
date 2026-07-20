import logging
from typing import Optional

from app.repositories.gate_session_repository import GateSessionRepository
from app.repositories.gate_transaction_repository import (
    GateTransactionRepository,
)

logger = logging.getLogger(__name__)


class AuditService:
    def __init__(self):
        self._session_repo = GateSessionRepository()
        self._txn_repo = GateTransactionRepository()

    async def get_vehicles_inside(
        self,
    ) -> list[dict]:
        sessions = await self._session_repo.get_vehicles_inside()
        return [self._session_to_dict(s) for s in sessions]

    async def get_vehicles_outside(
        self,
    ) -> list[dict]:
        sessions = await self._session_repo.get_vehicles_outside()
        return [self._session_to_dict(s) for s in sessions]

    async def get_active_sessions(
        self,
    ) -> list[dict]:
        sessions = await self._session_repo.get_all_active()
        return [self._session_to_dict(s) for s in sessions]

    async def get_session_history(
        self, vehicle_id: str, skip: int = 0, limit: int = 100,
    ) -> dict:
        session = await self._session_repo.get_active_by_vehicle_id(vehicle_id)
        txn_list = []
        if session:
            txn_list = await self._txn_repo.get_by_session_id(
                session.session_id, skip=skip, limit=limit,
            )
        raw_txns = await self._txn_repo.get_by_vehicle_id(
            vehicle_id, skip=skip, limit=limit,
        )
        # merge without duplicates
        seen_ids = {t.transaction_id for t in txn_list}
        for t in raw_txns:
            if t.transaction_id not in seen_ids:
                txn_list.append(t)
                seen_ids.add(t.transaction_id)
        txn_list.sort(key=lambda t: t.timestamp, reverse=True)
        return {
            "session": self._session_to_dict(session) if session else None,
            "transactions": [self._txn_to_dict(t) for t in txn_list],
        }

    async def get_statistics(self) -> dict:
        session_stats = {
            "vehicles_inside": await self._session_repo.count_inside(),
            "vehicles_outside": await self._session_repo.count_outside(),
            "total_sessions": await self._session_repo.count(),
        }
        txn_stats = await self._txn_repo.statistics()
        today_txns = await self._txn_repo.count_today()
        return {
            **session_stats,
            **txn_stats,
            "today_transactions": today_txns,
        }

    @staticmethod
    def _session_to_dict(session) -> dict:
        return {
            "session_id": session.session_id,
            "vehicle_id": session.vehicle_id,
            "current_state": session.current_state,
            "last_entry_time": (
                session.last_entry_time.isoformat()
                if session.last_entry_time else None
            ),
            "last_exit_time": (
                session.last_exit_time.isoformat()
                if session.last_exit_time else None
            ),
            "active": session.active,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat(),
        }

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
