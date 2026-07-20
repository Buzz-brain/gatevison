import logging
from datetime import datetime, timezone
from typing import Optional

import numpy as np

from app.models.image import ImageCategory
from app.services.ai.camera.camera_service import CameraService
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.camera.image_service import ImageService
from app.services.ai.camera.preprocessing import Preprocessing
from app.schemas.image import CaptureResponse

logger = logging.getLogger(__name__)


class AIPipeline:
    def __init__(
        self,
        camera_service: Optional[CameraService] = None,
        image_service: Optional[ImageService] = None,
    ):
        self.camera_service = camera_service or CameraService()
        self.image_service = image_service or ImageService()
        self.frame_processor = FrameProcessor()
        self.preprocessing = Preprocessing()

    async def capture(self) -> Optional[CaptureResponse]:
        logger.info("PIPELINE: Starting capture")
        try:
            frame = self.camera_service.capture()
            logger.info(f"PIPELINE: Frame captured ({frame.shape[1]}x{frame.shape[0]})")
            validation = self.camera_service.validate_frame(frame)
            logger.info(f"PIPELINE: Frame validation: {validation}")
            if not validation["valid"]:
                logger.warning(f"PIPELINE: Frame failed validation: {validation}")
            result = await self.image_service.save_from_frame(
                frame, ImageCategory.TEMP
            )
            logger.info(f"PIPELINE: Image saved: {result.filename}")
            return result
        except Exception as e:
            logger.error(f"PIPELINE: Capture failed: {e}")
            raise

    async def validate_image(self, frame: np.ndarray) -> dict:
        logger.info("PIPELINE: Validating image")
        quality = self.frame_processor.quality_score(frame)
        blur = self.frame_processor.blur_detection(frame)
        resolution = self.frame_processor.validate_resolution(frame)
        result = {
            "quality": quality,
            "blur": blur,
            "resolution": resolution,
            "passed": (
                quality["overall"] >= 50
                and not blur["is_blurry"]
                and resolution["valid"]
            ),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        logger.info(f"PIPELINE: Validation result: passed={result['passed']}")
        return result

    async def prepare_for_ai(self, frame: np.ndarray) -> dict:
        logger.info("PIPELINE: Preparing frame for AI processing")
        processed = self.frame_processor.resize_by_max(frame, max_dim=640)
        normalized = self.preprocessing.normalize(processed)
        info = {
            "original_shape": frame.shape,
            "processed_shape": processed.shape,
            "normalized_shape": normalized.shape,
            "normalized_dtype": str(normalized.dtype),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        logger.info(f"PIPELINE: Frame prepared: {processed.shape}")
        return info

    async def process_entry(self) -> dict:
        logger.info("PIPELINE: process_entry called - no AI models loaded yet")
        return {
            "stage": "entry",
            "status": "placeholder",
            "message": "Entry processing will be implemented when AI models are loaded",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def process_exit(self) -> dict:
        logger.info("PIPELINE: process_exit called - no AI models loaded yet")
        return {
            "stage": "exit",
            "status": "placeholder",
            "message": "Exit processing will be implemented when AI models are loaded",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
