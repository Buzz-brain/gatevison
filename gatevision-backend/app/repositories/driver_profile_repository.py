from datetime import datetime
from typing import Optional

from app.models.driver_profile import DriverProfile


class DriverProfileRepository:
    @staticmethod
    async def create(profile: DriverProfile) -> DriverProfile:
        return await profile.insert()

    @staticmethod
    async def get_by_driver_id(driver_id: str) -> Optional[DriverProfile]:
        return await DriverProfile.find_one(
            DriverProfile.driver_id == driver_id
        )

    @staticmethod
    async def get_by_id(record_id: str) -> Optional[DriverProfile]:
        return await DriverProfile.get(record_id)

    @staticmethod
    async def get_all(skip: int = 0, limit: int = 100) -> list[DriverProfile]:
        return (
            await DriverProfile.find_all()
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def update(profile: DriverProfile) -> DriverProfile:
        profile.updated_at = datetime.utcnow()
        return await profile.save()

    @staticmethod
    async def delete(driver_id: str) -> bool:
        profile = await DriverProfile.find_one(
            DriverProfile.driver_id == driver_id
        )
        if profile is None:
            return False
        await profile.delete()
        return True

    @staticmethod
    async def count() -> int:
        return await DriverProfile.find_all().count()

    @staticmethod
    async def find_active() -> list[DriverProfile]:
        return await DriverProfile.find(
            DriverProfile.status == "active"
        ).to_list()
