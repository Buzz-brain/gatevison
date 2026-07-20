from datetime import datetime
from typing import Optional

from app.models.vehicle_profile import VehicleProfile


class VehicleProfileRepository:
    @staticmethod
    async def create(profile: VehicleProfile) -> VehicleProfile:
        return await profile.insert()

    @staticmethod
    async def get_by_plate(plate_number: str) -> Optional[VehicleProfile]:
        normalized = plate_number.strip().upper()
        return await VehicleProfile.find_one(
            VehicleProfile.plate_number == normalized
        )

    @staticmethod
    async def get_by_vehicle_id(vehicle_id: str) -> Optional[VehicleProfile]:
        return await VehicleProfile.find_one(
            VehicleProfile.vehicle_id == vehicle_id
        )

    @staticmethod
    async def get_by_id(record_id: str) -> Optional[VehicleProfile]:
        return await VehicleProfile.get(record_id)

    @staticmethod
    async def get_all(skip: int = 0, limit: int = 100) -> list[VehicleProfile]:
        return (
            await VehicleProfile.find_all()
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def update(profile: VehicleProfile) -> VehicleProfile:
        profile.updated_at = datetime.utcnow()
        return await profile.save()

    @staticmethod
    async def delete(vehicle_id: str) -> bool:
        profile = await VehicleProfile.find_one(
            VehicleProfile.vehicle_id == vehicle_id
        )
        if profile is None:
            return False
        await profile.delete()
        return True

    @staticmethod
    async def count() -> int:
        return await VehicleProfile.find_all().count()
