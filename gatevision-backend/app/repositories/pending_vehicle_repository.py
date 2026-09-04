from datetime import datetime, timezone
from typing import Optional

from app.models.pending_vehicle import PendingVehicle


class PendingVehicleRepository:
    """Stores and retrieves single-use pending vehicle records."""

    @staticmethod
    async def create(record: PendingVehicle) -> PendingVehicle:
        return await record.insert()

    @staticmethod
    async def get(record_id: str) -> Optional[PendingVehicle]:
        return await PendingVehicle.get(record_id)

    @staticmethod
    async def find_latest(
        direction: str = "entry",
        include_expired: bool = False,
    ) -> Optional[PendingVehicle]:
        """Return the most recently created pending vehicle for a direction."""
        if include_expired:
            return await PendingVehicle.find_one(
                PendingVehicle.direction == direction,
                sort=[-PendingVehicle.created_at],
            )
        now = datetime.now(timezone.utc)
        return await PendingVehicle.find_one(
            {
                "$and": [
                    {"direction": direction},
                    {
                        "$or": [
                            {"expires_at": None},
                            {"expires_at": {"$gt": now}},
                        ]
                    },
                ]
            },
            sort=[-PendingVehicle.created_at],
        )

    @staticmethod
    async def delete(record_id: str) -> bool:
        record = await PendingVehicle.get(record_id)
        if record is None:
            return False
        await record.delete()
        return True

    @staticmethod
    async def delete_expired() -> int:
        now = datetime.now(timezone.utc)
        result = await PendingVehicle.find(PendingVehicle.expires_at <= now).delete()
        return result.deleted_count if result is not None else 0