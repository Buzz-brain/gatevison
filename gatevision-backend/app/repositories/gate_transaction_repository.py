from datetime import datetime
from typing import Optional

from app.models.gate_transaction import GateTransaction


class GateTransactionRepository:
    @staticmethod
    async def create(txn: GateTransaction) -> GateTransaction:
        return await txn.insert()

    @staticmethod
    async def get_by_transaction_id(
        transaction_id: str,
    ) -> Optional[GateTransaction]:
        return await GateTransaction.find_one(
            GateTransaction.transaction_id == transaction_id
        )

    @staticmethod
    async def get_by_session_id(
        session_id: str,
        skip: int = 0, limit: int = 100,
    ) -> list[GateTransaction]:
        return (
            await GateTransaction.find(
                GateTransaction.session_id == session_id,
            )
            .sort(-GateTransaction.timestamp)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def get_by_vehicle_id(
        vehicle_id: str,
        skip: int = 0, limit: int = 100,
    ) -> list[GateTransaction]:
        return (
            await GateTransaction.find(
                GateTransaction.vehicle_id == vehicle_id,
            )
            .sort(-GateTransaction.timestamp)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def get_all(
        skip: int = 0, limit: int = 100,
    ) -> list[GateTransaction]:
        return (
            await GateTransaction.find_all()
            .sort(-GateTransaction.timestamp)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def count() -> int:
        return await GateTransaction.find_all().count()

    @staticmethod
    async def count_by_action(action: str) -> int:
        return await GateTransaction.find(
            GateTransaction.action == action,
        ).count()

    @staticmethod
    async def statistics() -> dict:
        total = await GateTransaction.find_all().count()
        entries = await GateTransaction.find(
            GateTransaction.action == "ENTRY",
        ).count()
        exits = await GateTransaction.find(
            GateTransaction.action == "EXIT",
        ).count()
        return {
            "total_transactions": total,
            "entries": entries,
            "exits": exits,
        }

    @staticmethod
    async def count_today() -> int:
        from datetime import timezone
        import datetime as dt
        today_start = dt.datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0,
        )
        return await GateTransaction.find(
            GateTransaction.timestamp >= today_start,
        ).count()
