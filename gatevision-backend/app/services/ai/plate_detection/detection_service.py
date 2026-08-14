import asyncio
import logging
import time
from typing import Optional

import numpy as np

from app.config.settings import settings
from app.models.plate_detection import PlateDetection
from app.repositories.plate_detection_repository import PlateDetectionRepository
from app.services.ai.camera.camera_service import CameraService, CameraError
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.camera.image_service import ImageService
from app.services.ai.plate_detection.detector import PlateDetector, DetectionError
from app.services.ai.plate_detection.detection_logger import DetectionLogger
from app.services.ai.plate_detection.model_loader import ModelLoader
from app.services.ai.plate_detection.visualization import Visualization
from app.schemas.plate_detection import (
    DetectionResult,
    PlateDetectResponse,
    PlateDetectionResponse,
)

logger = logging.getLogger(__name__)


class DetectionService:
    def __init__(
        self,
        detector: Optional[PlateDetector] = None,
        repository: Optional[PlateDetectionRepository] = None,
        camera_service: Optional[CameraService] = None,
        image_service: Optional[ImageService] = None,
    ):
        self.detector = detector or PlateDetector()
        self.repository = repository or PlateDetectionRepository()
        self.camera_service = camera_service or CameraService()
        self.image_service = image_service or ImageService()
        self.detection_logger = DetectionLogger()

    async def detect_from_frame(
        self,
        frame: np.ndarray,
        image_id: str = "unknown",
        conf_threshold: Optional[float] = None,
        annotate: bool = False,
    ) -> dict:
        self.detection_logger.detection_started()

        start_time = time.perf_counter()
        detections = await asyncio.to_thread(
            self.detector.detect_and_crop, frame, image_id, conf_threshold,
        )
        total_time = (time.perf_counter() - start_time) * 1000

        model_meta = ModelLoader().get_metadata()
        model_version = model_meta.get("model_version", settings.VERSION)

        saved = []
        for det in detections:
            try:
                record = await self.repository.create_from_result(
                    image_id=image_id,
                    confidence=det["confidence"],
                    bbox=det["bbox"],
                    cropped_path=det.get("cropped_plate_path", ""),
                    inference_time_ms=det["inference_time_ms"],
                    model_version=model_version,
                )
                saved.append(record)
            except Exception as e:
                logger.warning(
                    "Failed to persist plate detection (continuing): %s", e
                )

        annotated_bytes = None
        if annotate:
            annotated_bytes = Visualization.draw_detections(frame, detections)

        self.detection_logger.detection_completed(len(detections), total_time)

        return {
            "detections": [
                DetectionResult(
                    confidence=d["confidence"],
                    bbox=d["bbox"],
                    cropped_plate_path=d.get("cropped_plate_path", ""),
                    inference_time_ms=d["inference_time_ms"],
                )
                for d in detections
            ],
            "total_plates": len(detections),
            "inference_time_ms": round(total_time, 2),
            "model_version": model_version,
            "annotated_image": annotated_bytes,
        }

    async def detect_from_camera(
        self,
        conf_threshold: Optional[float] = None,
        annotate: bool = False,
    ) -> dict:
        if not self.camera_service.is_running():
            raise CameraError("Camera is not running")

        frame = self.camera_service.capture()
        capture_result = await self.image_service.save_from_frame(
            frame, category="plate"
        )
        image_id = capture_result.image_id

        return await self.detect_from_frame(
            frame, image_id=image_id, conf_threshold=conf_threshold, annotate=annotate
        )

    async def detect_from_upload(
        self,
        data: bytes,
        conf_threshold: Optional[float] = None,
        annotate: bool = False,
    ) -> dict:
        frame = FrameProcessor.read_bytes(data)
        if frame is None:
            raise DetectionError("Invalid image data")

        capture_result = await self.image_service.save_from_bytes(
            data, category="plate"
        )
        image_id = capture_result.image_id if capture_result else "upload"

        return await self.detect_from_frame(
            frame, image_id=image_id, conf_threshold=conf_threshold, annotate=annotate
        )

    async def get_history(
        self, skip: int = 0, limit: int = 100
    ) -> list[PlateDetectionResponse]:
        records = await self.repository.get_all(skip, limit)
        records.sort(key=lambda r: r.created_at, reverse=True)
        return [self._to_response(r) for r in records]

    async def get_detection(self, detection_id: str) -> Optional[PlateDetectionResponse]:
        record = await self.repository.get_by_id(detection_id)
        if record is None:
            return None
        return self._to_response(record)

    async def get_model_info(self) -> dict:
        loader = ModelLoader()
        return loader.get_metadata()

    def _to_response(self, record: PlateDetection) -> PlateDetectionResponse:
        return PlateDetectionResponse(
            id=str(record.id),
            image_id=record.image_id,
            confidence=record.confidence,
            bbox=record.bbox,
            cropped_plate_path=record.cropped_plate_path,
            inference_time_ms=record.inference_time_ms,
            model_version=record.model_version,
            created_at=record.created_at,
        )
