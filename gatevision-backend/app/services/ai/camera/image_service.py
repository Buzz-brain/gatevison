import logging
from datetime import datetime, timezone
from typing import Optional

import numpy as np

from app.models.image import Image, ImageCategory
from app.repositories.image_repository import ImageRepository
from app.services.ai.camera.camera_service import CameraService
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.camera.storage_service import ImageStorageService
from app.schemas.image import CaptureResponse, ImageResponse

logger = logging.getLogger(__name__)


class ImageService:
    def __init__(
        self,
        camera_service: Optional[CameraService] = None,
        storage_service: Optional[ImageStorageService] = None,
        repository: Optional[ImageRepository] = None,
    ):
        self.camera_service = camera_service or CameraService()
        self.storage_service = storage_service or ImageStorageService()
        self.repository = repository or ImageRepository()

    async def capture_and_save(
        self,
        category: ImageCategory = ImageCategory.TEMP,
        camera_id: str = "default",
    ) -> CaptureResponse:
        frame = self.camera_service.capture()
        return await self._process_and_save(frame, category, camera_id)

    async def save_from_bytes(
        self,
        data: bytes,
        category: ImageCategory = ImageCategory.TEMP,
        camera_id: str = "default",
    ) -> Optional[CaptureResponse]:
        frame = FrameProcessor.read_bytes(data)
        if frame is None:
            logger.error("Invalid image bytes provided")
            return None
        return await self._process_and_save(frame, category, camera_id)

    async def save_from_frame(
        self,
        frame: np.ndarray,
        category: ImageCategory = ImageCategory.TEMP,
        camera_id: str = "default",
    ) -> CaptureResponse:
        return await self._process_and_save(frame, category, camera_id)

    async def _process_and_save(
        self,
        frame: np.ndarray,
        category: ImageCategory,
        camera_id: str,
    ) -> CaptureResponse:
        if frame is None or frame.size == 0:
            raise ValueError("Cannot save empty frame")

        height, width = frame.shape[:2]
        image_bytes = FrameProcessor.to_bytes(frame)
        filesize = len(image_bytes)
        now = datetime.now(timezone.utc)
        category_value = category.value if isinstance(category, ImageCategory) else category

        storage_result = self.storage_service.save(image_bytes, category_value)

        image_doc = await self.repository.create_from_dict({
            "filename": storage_result["filename"],
            "filepath": storage_result["filepath"],
            "category": category,
            "mime_type": "image/jpeg",
            "width": width,
            "height": height,
            "filesize": filesize,
            "camera_id": camera_id,
            "captured_at": now,
        })

        logger.info(
            f"Image saved: {image_doc.filename} "
            f"({width}x{height}, {filesize} bytes, category={category_value})"
        )

        return CaptureResponse(
            image_id=str(image_doc.id),
            filename=image_doc.filename,
            filepath=image_doc.filepath,
            width=width,
            height=height,
            filesize=filesize,
            category=category_value,
            captured_at=now,
        )

    async def get_image(self, image_id: str) -> Optional[ImageResponse]:
        image = await self.repository.get_by_id(image_id)
        if image is None:
            return None
        return ImageResponse(
            id=str(image.id),
            filename=image.filename,
            filepath=image.filepath,
            category=image.category,
            mime_type=image.mime_type,
            width=image.width,
            height=image.height,
            filesize=image.filesize,
            camera_id=image.camera_id,
            captured_at=image.captured_at,
            created_at=image.created_at,
        )

    async def get_images(
        self, skip: int = 0, limit: int = 100
    ) -> list[ImageResponse]:
        images = await self.repository.get_all(skip, limit)
        return [self._to_response(img) for img in images]

    async def get_images_by_category(
        self, category: ImageCategory, skip: int = 0, limit: int = 100
    ) -> list[ImageResponse]:
        images = await self.repository.get_by_category(category, skip, limit)
        return [self._to_response(img) for img in images]

    async def delete_image(self, image_id: str) -> bool:
        image = await self.repository.get_by_id(image_id)
        if image is None:
            return False
        self.storage_service.delete(image.filepath)
        await self.repository.delete(image_id)
        logger.info(f"Image deleted: {image.filename}")
        return True

    def _to_response(self, image: Image) -> ImageResponse:
        return ImageResponse(
            id=str(image.id),
            filename=image.filename,
            filepath=image.filepath,
            category=image.category,
            mime_type=image.mime_type,
            width=image.width,
            height=image.height,
            filesize=image.filesize,
            camera_id=image.camera_id,
            captured_at=image.captured_at,
            created_at=image.created_at,
        )
