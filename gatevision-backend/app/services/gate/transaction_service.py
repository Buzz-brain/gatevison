import logging
from typing import Optional

from app.models.gate_transaction import GateTransaction
from app.repositories.gate_transaction_repository import (
    GateTransactionRepository,
)

logger = logging.getLogger(__name__)


class TransactionService:
    def __init__(self):
        self._repo = GateTransactionRepository()

    async def create_transaction(
        self,
        session_id: str,
        vehicle_id: str,
        action: str,
        decision: str,
        request_id: Optional[str] = None,
        driver_id: Optional[str] = None,
        gate_name: str = "Main Gate",
        notes: Optional[str] = None,
    ) -> GateTransaction:
        import uuid
        txn = GateTransaction(
            transaction_id=str(uuid.uuid4()),
            session_id=session_id,
            vehicle_id=vehicle_id,
            driver_id=driver_id,
            action=action,
            decision=decision,
            request_id=request_id,
            gate_name=gate_name,
            notes=notes,
        )
        return await self._repo.create(txn)

    async def get_transactions_for_vehicle(
        self, vehicle_id: str, skip: int = 0, limit: int = 100,
    ) -> list[GateTransaction]:
        return await self._repo.get_by_vehicle_id(
            vehicle_id, skip=skip, limit=limit,
        )

    async def get_transactions_for_session(
        self, session_id: str, skip: int = 0, limit: int = 100,
    ) -> list[GateTransaction]:
        return await self._repo.get_by_session_id(
            session_id, skip=skip, limit=limit,
        )

    async def get_all_transactions(
        self, skip: int = 0, limit: int = 100,
    ) -> list[GateTransaction]:
        return await self._repo.get_all(skip=skip, limit=limit)

    async def get_statistics(self) -> dict:
        return await self._repo.statistics()

    async def count_today(self) -> int:
        return await self._repo.count_today()
