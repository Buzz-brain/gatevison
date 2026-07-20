from typing import Optional

from app.models.image import Image, ImageCategory
from app.repositories.base import BaseRepository
from app.schemas.image import ImageCreate, ImageUpdate


class ImageRepository(BaseRepository[Image, ImageCreate, ImageUpdate]):
    def __init__(self):
        super().__init__(Image)

    async def get_by_category(
        self, category: ImageCategory, skip: int = 0, limit: int = 100
    ) -> list[Image]:
        return (
            await self.model.find(self.model.category == category)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    async def get_by_camera(
        self, camera_id: str, skip: int = 0, limit: int = 100
    ) -> list[Image]:
        return (
            await self.model.find(self.model.camera_id == camera_id)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    async def get_recent(self, limit: int = 20) -> list[Image]:
        return (
            await self.model.find()
            .sort(-self.model.created_at)
            .limit(limit)
            .to_list()
        )

    async def create_from_dict(self, data: dict) -> Image:
        instance = self.model(**data)
        return await instance.insert()
