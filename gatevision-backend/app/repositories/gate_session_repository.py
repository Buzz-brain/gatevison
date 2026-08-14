from datetime import datetime
from typing import Optional

from app.models.gate_session import GateSession


class GateSessionRepository:
    @staticmethod
    async def create(session: GateSession) -> GateSession:
        return await session.insert()

    @staticmethod
    async def get_by_session_id(session_id: str) -> Optional[GateSession]:
        return await GateSession.find_one(
            GateSession.session_id == session_id
        )

    @staticmethod
    async def get_by_vehicle_id(vehicle_id: str) -> Optional[GateSession]:
        return await GateSession.find_one(
            GateSession.vehicle_id == vehicle_id
        )

    @staticmethod
    async def get_active_by_vehicle_id(
        vehicle_id: str,
    ) -> Optional[GateSession]:
        return await GateSession.find_one(
            GateSession.vehicle_id == vehicle_id,
            GateSession.active == True,
        )

    @staticmethod
    async def update(session: GateSession) -> GateSession:
        session.updated_at = datetime.utcnow()
        return await session.save()

    @staticmethod
    async def get_all_active() -> list[GateSession]:
        return await GateSession.find(
            GateSession.active == True,
        ).to_list()

    @staticmethod
    async def get_vehicles_inside() -> list[GateSession]:
        return await GateSession.find(
            GateSession.current_state == "INSIDE",
            GateSession.active == True,
        ).to_list()

    @staticmethod
    async def get_vehicles_outside() -> list[GateSession]:
        return await GateSession.find(
            GateSession.current_state == "OUTSIDE",
            GateSession.active == True,
        ).to_list()

    @staticmethod
    async def get_all(
        skip: int = 0, limit: int = 100,
    ) -> list[GateSession]:
        return (
            await GateSession.find_all()
            .sort(-GateSession.updated_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def count() -> int:
        return await GateSession.find_all().count()

    @staticmethod
    async def delete_by_id(session_id: str) -> bool:
        session = await GateSession.get(session_id)
        if session is None:
            return False
        await session.delete()
        return True

    @staticmethod
    async def delete_all() -> int:
        result = await GateSession.find_all().delete()
        return result.deleted_count if result is not None else 0

    @staticmethod
    async def count_inside() -> int:
        return await GateSession.find(
            GateSession.current_state == "INSIDE",
            GateSession.active == True,
        ).count()

    @staticmethod
    async def count_outside() -> int:
        return await GateSession.find(
            GateSession.current_state == "OUTSIDE",
            GateSession.active == True,
        ).count()
