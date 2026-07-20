import logging
import time
from typing import Optional

import cv2
import numpy as np

from app.config.settings import settings
from app.services.ai.plate_detection.model_loader import ModelLoader, ModelLoadError
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.camera.storage_service import ImageStorageService

logger = logging.getLogger(__name__)


class DetectionError(Exception):
    pass


class PlateDetector:
    def __init__(
        self,
        model_loader: Optional[ModelLoader] = None,
        storage_service: Optional[ImageStorageService] = None,
    ):
        self.model_loader = model_loader or ModelLoader()
        self.storage_service = storage_service or ImageStorageService()

    def detect(
        self, frame: np.ndarray, conf_threshold: Optional[float] = None
    ) -> list[dict]:
        if frame is None or frame.size == 0:
            raise DetectionError("Empty frame provided for detection")

        threshold = conf_threshold if conf_threshold is not None else settings.PLATE_DETECTION_CONFIDENCE

        try:
            model = self.model_loader.get_model()
        except ModelLoadError:
            self.model_loader.load()
            model = self.model_loader.get_model()

        start_time = time.perf_counter()
        results = model(frame, conf=threshold, verbose=False)
        inference_time = (time.perf_counter() - start_time) * 1000

        detections = []
        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                confidence = float(box.conf[0])
                detections.append({
                    "confidence": round(confidence, 4),
                    "bbox": [x1, y1, x2, y2],
                    "inference_time_ms": round(inference_time, 2),
                })

        detections.sort(key=lambda d: d["confidence"], reverse=True)
        return detections

    def detect_and_crop(
        self,
        frame: np.ndarray,
        image_id: str = "unknown",
        conf_threshold: Optional[float] = None,
    ) -> list[dict]:
        detections = self.detect(frame, conf_threshold)

        for det in detections:
            crop = self._crop_plate(frame, det["bbox"])
            if crop is None:
                det["cropped_plate_path"] = ""
                continue

            crop_bytes = FrameProcessor.to_bytes(crop)
            storage_result = self.storage_service.save(
                crop_bytes, "plate",
                filename=f"plate_{det['confidence']:.3f}.jpg",
            )
            det["cropped_plate_path"] = storage_result["filepath"]

        return detections

    def detect_from_bytes(
        self, data: bytes, conf_threshold: Optional[float] = None
    ) -> list[dict]:
        frame = FrameProcessor.read_bytes(data)
        if frame is None:
            raise DetectionError("Failed to decode image from bytes")
        return self.detect(frame, conf_threshold)

    def _crop_plate(self, frame: np.ndarray, bbox: list[int]) -> Optional[np.ndarray]:
        x1, y1, x2, y2 = bbox
        h, w = frame.shape[:2]
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w, x2)
        y2 = min(h, y2)

        if x2 <= x1 or y2 <= y1:
            logger.warning(f"Invalid bbox for crop: {bbox}")
            return None

        return frame[y1:y2, x1:x2]
