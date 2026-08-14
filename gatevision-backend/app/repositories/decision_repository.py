from datetime import datetime, timezone
from typing import Optional

from app.models.decision_record import DecisionRecord


class DecisionRepository:
    @staticmethod
    async def create(record: DecisionRecord) -> DecisionRecord:
        return await record.insert()

    @staticmethod
    async def get_by_id(record_id: str) -> Optional[DecisionRecord]:
        return await DecisionRecord.get(record_id)

    @staticmethod
    async def get_by_request_id(request_id: str) -> Optional[DecisionRecord]:
        return await DecisionRecord.find_one(
            DecisionRecord.request_id == request_id
        )

    @staticmethod
    async def get_all(
        skip: int = 0, limit: int = 100,
    ) -> list[DecisionRecord]:
        return (
            await DecisionRecord.find_all()
            .sort(-DecisionRecord.created_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def count() -> int:
        return await DecisionRecord.find_all().count()

    @staticmethod
    async def update_decision(
        request_id: str,
        decision: str,
        explanation: str,
    ) -> bool:
        record = await DecisionRecord.find_one(
            DecisionRecord.request_id == request_id
        )
        if record is None:
            return False
        record.decision = decision
        record.explanation = explanation
        await record.save()
        return True

    @staticmethod
    async def delete_by_id(record_id: str) -> bool:
        record = await DecisionRecord.get(record_id)
        if record is None:
            return False
        await record.delete()
        return True

    @staticmethod
    async def delete_all() -> int:
        result = await DecisionRecord.find_all().delete()
        return result.deleted_count if result is not None else 0

    @staticmethod
    async def statistics() -> dict:
        total = await DecisionRecord.find_all().count()
        grants = await DecisionRecord.find(
            DecisionRecord.decision == "GRANT"
        ).count()
        denials = await DecisionRecord.find(
            DecisionRecord.decision == "DENY"
        ).count()
        reviews = await DecisionRecord.find(
            DecisionRecord.decision == "MANUAL_REVIEW"
        ).count()

        return {
            "total_decisions": total,
            "grants": grants,
            "denials": denials,
            "manual_reviews": reviews,
            "grant_rate": round(grants / total, 4) if total else 0.0,
        }
