from datetime import datetime
from typing import Optional

from app.models.access_policy import AccessPolicy


class AccessPolicyRepository:
    @staticmethod
    async def create(policy: AccessPolicy) -> AccessPolicy:
        return await policy.insert()

    @staticmethod
    async def get_by_policy_id(policy_id: str) -> Optional[AccessPolicy]:
        return await AccessPolicy.find_one(
            AccessPolicy.policy_id == policy_id
        )

    @staticmethod
    async def get_by_target(target_type: str, target_id: str) -> list[AccessPolicy]:
        return await AccessPolicy.find(
            AccessPolicy.target_type == target_type,
            AccessPolicy.target_id == target_id,
        ).to_list()

    @staticmethod
    async def get_by_id(record_id: str) -> Optional[AccessPolicy]:
        return await AccessPolicy.get(record_id)

    @staticmethod
    async def get_all(skip: int = 0, limit: int = 100) -> list[AccessPolicy]:
        return (
            await AccessPolicy.find_all()
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def update(policy: AccessPolicy) -> AccessPolicy:
        policy.updated_at = datetime.utcnow()
        return await policy.save()

    @staticmethod
    async def delete(policy_id: str) -> bool:
        policy = await AccessPolicy.find_one(
            AccessPolicy.policy_id == policy_id
        )
        if policy is None:
            return False
        await policy.delete()
        return True

    @staticmethod
    async def count() -> int:
        return await AccessPolicy.find_all().count()
