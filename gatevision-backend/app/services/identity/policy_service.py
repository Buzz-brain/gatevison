import logging
from datetime import datetime, timezone
from typing import Optional

from app.models.access_policy import AccessPolicy
from app.repositories.access_policy_repository import AccessPolicyRepository

logger = logging.getLogger(__name__)


class PolicyEvaluationError(Exception):
    pass


class PolicyService:
    def __init__(self):
        self._repo = AccessPolicyRepository()

    async def create_policy(self, policy: AccessPolicy) -> AccessPolicy:
        existing = await self._repo.get_by_policy_id(policy.policy_id)
        if existing:
            raise PolicyEvaluationError(
                f"Policy '{policy.policy_id}' already exists"
            )
        return await self._repo.create(policy)

    async def get_policy(self, policy_id: str) -> Optional[AccessPolicy]:
        return await self._repo.get_by_policy_id(policy_id)

    async def get_policies_for(
        self, target_type: str, target_id: str,
    ) -> list[AccessPolicy]:
        return await self._repo.get_by_target(target_type, target_id)

    async def update_policy(
        self, policy_id: str, updates: dict,
    ) -> Optional[AccessPolicy]:
        policy = await self._repo.get_by_policy_id(policy_id)
        if not policy:
            return None
        for key, value in updates.items():
            if value is not None and hasattr(policy, key):
                setattr(policy, key, value)
        return await self._repo.update(policy)

    async def delete_policy(self, policy_id: str) -> bool:
        return await self._repo.delete(policy_id)

    async def is_driver_active(self, driver_id: str) -> bool:
        from app.repositories.driver_profile_repository import (
            DriverProfileRepository,
        )
        driver = await DriverProfileRepository().get_by_driver_id(driver_id)
        return driver is not None and driver.status == "active"

    async def is_vehicle_active(self, vehicle_id: str) -> bool:
        from app.repositories.vehicle_profile_repository import (
            VehicleProfileRepository,
        )
        vehicle = await VehicleProfileRepository().get_by_vehicle_id(vehicle_id)
        return vehicle is not None and vehicle.registration_status == "active"

    async def is_blacklisted(self, target_type: str, target_id: str) -> bool:
        policies = await self._repo.get_by_target(target_type, target_id)
        return any(p.blacklist for p in policies)

    async def is_expired(self, policy: AccessPolicy) -> bool:
        if policy.expiration_date is None:
            return False
        return datetime.now(timezone.utc) > policy.expiration_date.replace(
            tzinfo=timezone.utc
        )

    async def is_access_allowed_now(self, policy: AccessPolicy) -> bool:
        if policy.blacklist:
            return False

        if await self.is_expired(policy):
            return False

        now = datetime.now(timezone.utc)
        day_abbr = now.strftime("%a").lower()[:3]

        if day_abbr not in [d.lower().strip()[:3] for d in policy.allowed_days]:
            return False

        current_time = now.strftime("%H:%M")
        for time_range in policy.allowed_time_ranges:
            start = time_range.get("start", "00:00")
            end = time_range.get("end", "23:59")
            if start <= current_time <= end:
                return True

        return False

    async def evaluate_for_target(
        self, target_type: str, target_id: str,
    ) -> dict:
        policies = await self._repo.get_by_target(target_type, target_id)

        if not policies:
            return {
                "allowed": True,
                "blacklisted": False,
                "expired": False,
                "reason": "No policies restrict access",
            }

        for p in policies:
            if p.blacklist:
                return {
                    "allowed": False,
                    "blacklisted": True,
                    "expired": False,
                    "reason": f"Target is blacklisted by policy '{p.policy_id}'",
                }

        for p in policies:
            if await self.is_expired(p):
                return {
                    "allowed": False,
                    "blacklisted": False,
                    "expired": True,
                    "reason": f"Policy '{p.policy_id}' has expired",
                }

        allowed_now = False
        for p in policies:
            if await self.is_access_allowed_now(p):
                allowed_now = True
                break

        if not allowed_now:
            return {
                "allowed": False,
                "blacklisted": False,
                "expired": False,
                "reason": "No policy allows access at this time",
            }

        return {
            "allowed": True,
            "blacklisted": False,
            "expired": False,
            "reason": "Access permitted by policy",
        }
