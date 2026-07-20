import logging
from typing import Optional

from app.models.face_record import FaceRecord

logger = logging.getLogger(__name__)


class FaceRepository:
    async def create(self, **kwargs) -> FaceRecord:
        record = FaceRecord(**kwargs)
        return await record.insert()

    async def get_by_id(self, record_id: str) -> Optional[FaceRecord]:
        return await FaceRecord.get(record_id)

    async def get_recent(
        self, skip: int = 0, limit: int = 100,
    ) -> list[FaceRecord]:
        return (
            await FaceRecord
            .find_all()
            .sort(-FaceRecord.created_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    async def count_successful(self) -> int:
        return await FaceRecord.find(
            FaceRecord.matched == True
        ).count()

    async def count_all(self) -> int:
        return await FaceRecord.find_all().count()
