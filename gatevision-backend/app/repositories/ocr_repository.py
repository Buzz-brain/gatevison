import re
from typing import Optional

from app.models.ocr_result import OcrResult
from app.repositories.base import BaseRepository


class EmptyUpdate:
    pass


class OcrRepository(BaseRepository[OcrResult, dict, EmptyUpdate]):
    def __init__(self):
        super().__init__(OcrResult)

    async def create_from_ocr(
        self,
        raw_text: str,
        cleaned_text: str,
        confidence: float,
        processing_time: float,
        validation_status: str = "unchecked",
        validation_message: str = "",
        plate_detection_id: Optional[str] = None,
    ) -> OcrResult:
        instance = OcrResult(
            plate_detection_id=plate_detection_id,
            raw_text=raw_text,
            cleaned_text=cleaned_text,
            confidence=confidence,
            processing_time=processing_time,
            validation_status=validation_status,
            validation_message=validation_message,
        )
        return await instance.insert()

    async def get_by_detection_id(self, detection_id: str) -> Optional[OcrResult]:
        return await self.model.find_one(
            self.model.plate_detection_id == detection_id
        )

    async def search_by_plate(self, query: str, limit: int = 50) -> list[OcrResult]:
        escaped = re.escape(query)
        return (
            await self.model.find(
                self.model.cleaned_text == {"$regex": escaped, "$options": "i"}
            )
            .sort(-self.model.created_at)
            .limit(limit)
            .to_list()
        )

    async def get_recent(
        self, skip: int = 0, limit: int = 100
    ) -> list[OcrResult]:
        return (
            await self.model.find()
            .sort(-self.model.created_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    async def count_successful(self) -> int:
        return await self.model.find(
            self.model.validation_status == "valid"
        ).count()

    async def count_all(self) -> int:
        return await self.model.find_all().count()
