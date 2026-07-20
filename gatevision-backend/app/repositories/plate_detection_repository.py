from app.models.plate_detection import PlateDetection
from app.repositories.base import BaseRepository
from app.schemas.plate_detection import DetectionResult


class EmptyUpdate:
    pass


class PlateDetectionRepository(BaseRepository[PlateDetection, DetectionResult, EmptyUpdate]):
    def __init__(self):
        super().__init__(PlateDetection)

    async def create_from_result(
        self,
        image_id: str,
        confidence: float,
        bbox: list[int],
        cropped_path: str,
        inference_time_ms: float,
        model_version: str,
    ) -> PlateDetection:
        instance = PlateDetection(
            image_id=image_id,
            confidence=confidence,
            bbox=bbox,
            cropped_plate_path=cropped_path,
            inference_time_ms=inference_time_ms,
            model_version=model_version,
        )
        return await instance.insert()

    async def get_recent(self, limit: int = 50) -> list[PlateDetection]:
        return (
            await self.model.find()
            .sort(-self.model.created_at)
            .limit(limit)
            .to_list()
        )

    async def get_by_confidence(
        self, min_conf: float, skip: int = 0, limit: int = 100
    ) -> list[PlateDetection]:
        return (
            await self.model.find(self.model.confidence >= min_conf)
            .sort(-self.model.confidence)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    async def count_detections(self) -> int:
        return await self.model.find_all().count()
