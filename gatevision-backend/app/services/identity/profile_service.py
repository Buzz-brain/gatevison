import logging
from typing import Optional

from app.models.driver_profile import DriverProfile
from app.models.vehicle_profile import VehicleProfile
from app.repositories.driver_profile_repository import DriverProfileRepository
from app.repositories.vehicle_profile_repository import VehicleProfileRepository
from app.services.identity.identity_logger import IdentityLogger

logger = logging.getLogger(__name__)


class ProfileService:
    def __init__(self):
        self._driver_repo = DriverProfileRepository()
        self._vehicle_repo = VehicleProfileRepository()
        self._log = IdentityLogger()

    async def get_driver(self, driver_id: str) -> Optional[DriverProfile]:
        return await self._driver_repo.get_by_driver_id(driver_id)

    async def get_all_drivers(
        self, skip: int = 0, limit: int = 100,
    ) -> list[DriverProfile]:
        return await self._driver_repo.get_all(skip=skip, limit=limit)

    async def update_driver(
        self, driver_id: str, updates: dict,
    ) -> Optional[DriverProfile]:
        driver = await self._driver_repo.get_by_driver_id(driver_id)
        if not driver:
            return None
        for key, value in updates.items():
            if value is not None and hasattr(driver, key):
                setattr(driver, key, value)
        result = await self._driver_repo.update(driver)
        self._log.log_update("driver", driver_id)
        return result

    async def delete_driver(self, driver_id: str) -> bool:
        result = await self._driver_repo.delete(driver_id)
        if result:
            self._log.log_delete("driver", driver_id)
        return result

    async def get_vehicle_by_plate(self, plate: str) -> Optional[VehicleProfile]:
        return await self._vehicle_repo.get_by_plate(plate)

    async def get_vehicle_by_id(self, vehicle_id: str) -> Optional[VehicleProfile]:
        return await self._vehicle_repo.get_by_vehicle_id(vehicle_id)

    async def get_all_vehicles(
        self, skip: int = 0, limit: int = 100,
    ) -> list[VehicleProfile]:
        return await self._vehicle_repo.get_all(skip=skip, limit=limit)

    async def update_vehicle(
        self, vehicle_id: str, updates: dict,
    ) -> Optional[VehicleProfile]:
        vehicle = await self._vehicle_repo.get_by_vehicle_id(vehicle_id)
        if not vehicle:
            return None
        for key, value in updates.items():
            if value is not None and hasattr(vehicle, key):
                setattr(vehicle, key, value)
        result = await self._vehicle_repo.update(vehicle)
        self._log.log_update("vehicle", vehicle_id)
        return result

    async def delete_vehicle(self, vehicle_id: str) -> bool:
        result = await self._vehicle_repo.delete(vehicle_id)
        if result:
            self._log.log_delete("vehicle", vehicle_id)
        return result
