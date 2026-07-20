import logging
from datetime import datetime
from typing import Optional

from app.config.settings import settings
from app.models.access_policy import AccessPolicy
from app.models.driver_profile import DriverProfile
from app.models.vehicle_profile import VehicleProfile
from app.repositories.access_policy_repository import AccessPolicyRepository
from app.repositories.driver_profile_repository import DriverProfileRepository
from app.repositories.vehicle_profile_repository import VehicleProfileRepository
from app.services.identity.identity_logger import IdentityLogger

logger = logging.getLogger(__name__)


class RegistrationError(Exception):
    pass


class RegistrationService:
    def __init__(self):
        self._driver_repo = DriverProfileRepository()
        self._vehicle_repo = VehicleProfileRepository()
        self._policy_repo = AccessPolicyRepository()
        self._log = IdentityLogger()

    async def register_driver(
        self,
        driver_id: str,
        full_name: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        department: Optional[str] = None,
        status: str = "active",
    ) -> DriverProfile:
        existing = await self._driver_repo.get_by_driver_id(driver_id)
        if existing:
            raise RegistrationError(f"Driver '{driver_id}' already exists")

        profile = DriverProfile(
            driver_id=driver_id,
            full_name=full_name,
            email=email,
            phone=phone,
            department=department,
            status=status,
        )
        result = await self._driver_repo.create(profile)
        self._log.log_create("driver", driver_id)
        return result

    async def register_vehicle(
        self,
        vehicle_id: str,
        plate_number: str,
        make: Optional[str] = None,
        model: Optional[str] = None,
        color: Optional[str] = None,
        year: Optional[int] = None,
        owner_id: Optional[str] = None,
        registration_status: str = "active",
    ) -> VehicleProfile:
        normalized = plate_number.strip().upper()
        existing = await self._vehicle_repo.get_by_plate(normalized)
        if existing:
            raise RegistrationError(
                f"Vehicle with plate '{normalized}' already exists"
            )

        profile = VehicleProfile(
            vehicle_id=vehicle_id,
            plate_number=normalized,
            make=make,
            model=model,
            color=color,
            year=year,
            owner_id=owner_id,
            registration_status=registration_status,
        )
        result = await self._vehicle_repo.create(profile)
        self._log.log_create("vehicle", vehicle_id)
        return result

    async def link_drivers(
        self, vehicle_id: str, driver_ids: list[str],
    ) -> VehicleProfile:
        vehicle = await self._vehicle_repo.get_by_vehicle_id(vehicle_id)
        if not vehicle:
            raise RegistrationError(f"Vehicle '{vehicle_id}' not found")

        for did in driver_ids:
            driver = await self._driver_repo.get_by_driver_id(did)
            if not driver:
                raise RegistrationError(f"Driver '{did}' not found")
            if driver.status != "active":
                raise RegistrationError(f"Driver '{did}' is not active")

        if not settings.ALLOW_MULTIPLE_DRIVERS_PER_VEHICLE and len(driver_ids) > 1:
            raise RegistrationError("Multiple drivers per vehicle not allowed")

        existing = set(vehicle.linked_driver_ids)
        for did in driver_ids:
            existing.add(did)
        vehicle.linked_driver_ids = list(existing)
        result = await self._vehicle_repo.update(vehicle)
        self._log.log_link(vehicle_id, driver_ids)
        return result

    async def unlink_driver(self, vehicle_id: str, driver_id: str) -> VehicleProfile:
        vehicle = await self._vehicle_repo.get_by_vehicle_id(vehicle_id)
        if not vehicle:
            raise RegistrationError(f"Vehicle '{vehicle_id}' not found")

        if driver_id in vehicle.linked_driver_ids:
            vehicle.linked_driver_ids.remove(driver_id)
        result = await self._vehicle_repo.update(vehicle)
        self._log.log_update("vehicle", vehicle_id)
        return result

    async def store_face_embedding(
        self, driver_id: str, embedding: list[float],
    ) -> DriverProfile:
        driver = await self._driver_repo.get_by_driver_id(driver_id)
        if not driver:
            raise RegistrationError(f"Driver '{driver_id}' not found")
        driver.face_embedding_reference = embedding
        result = await self._driver_repo.update(driver)
        self._log.log_update("driver", driver_id)
        return result

    async def store_vehicle_embedding(
        self, vehicle_id: str, embedding: list[float],
    ) -> VehicleProfile:
        vehicle = await self._vehicle_repo.get_by_vehicle_id(vehicle_id)
        if not vehicle:
            raise RegistrationError(f"Vehicle '{vehicle_id}' not found")
        vehicle.vehicle_embedding_reference = embedding
        result = await self._vehicle_repo.update(vehicle)
        self._log.log_update("vehicle", vehicle_id)
        return result

    async def deactivate_driver(self, driver_id: str) -> DriverProfile:
        driver = await self._driver_repo.get_by_driver_id(driver_id)
        if not driver:
            raise RegistrationError(f"Driver '{driver_id}' not found")
        driver.status = "suspended"
        result = await self._driver_repo.update(driver)
        self._log.log_update("driver", driver_id)
        return result

    async def deactivate_vehicle(self, vehicle_id: str) -> VehicleProfile:
        vehicle = await self._vehicle_repo.get_by_vehicle_id(vehicle_id)
        if not vehicle:
            raise RegistrationError(f"Vehicle '{vehicle_id}' not found")
        vehicle.registration_status = "suspended"
        result = await self._vehicle_repo.update(vehicle)
        self._log.log_update("vehicle", vehicle_id)
        return result
