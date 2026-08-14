import logging
import threading
import time
from typing import Optional

import cv2
import numpy as np

from app.config.settings import settings
from app.services.ai.plate_detection.model_loader import ModelLoader, ModelLoadError
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.camera.storage_service import ImageStorageService

logger = logging.getLogger(__name__)

# Normalized substrings/names that identify a license-plate class. A detector
# trained for plates exposes a class such as "license_plate", "plate",
# "number_plate" or "registration_plate". The generic COCO model (80 classes:
# person, car, bus, ...) has no plate class, so nothing passes this filter.
PLATE_CLASS_HINTS = ("plate", "licence", "license", "registration")


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
        # Serialize inference on the shared YOLO model across worker threads.
        self._lock = threading.Lock()

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
        with self._lock:
            results = model(frame, conf=threshold, verbose=False)
        inference_time = (time.perf_counter() - start_time) * 1000

        plate_classes = self._plate_class_indices(
            results[0] if results else None, model
        )
        if not plate_classes:
            logger.warning(
                "Loaded YOLO model has no license-plate class (classes=%s); "
                "all detections will be dropped. Load a dedicated plate "
                "detection model (e.g. license_plate_detector.pt).",
                self._model_names(results, model),
            )

        detections = []
        for result in results:
            if result.boxes is None:
                continue
            for box in result.boxes:
                if not self._is_plate_box(box, plate_classes):
                    continue
                x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                confidence = float(box.conf[0])
                detections.append({
                    "confidence": round(confidence, 4),
                    "bbox": [x1, y1, x2, y2],
                    "inference_time_ms": round(inference_time, 2),
                })

        detections.sort(key=lambda d: d["confidence"], reverse=True)
        return detections

    @staticmethod
    def _model_names(result, model):
        """Return {class_index: name} or None when names are unknown/unparseable."""
        names = getattr(result, "names", None) or getattr(model, "names", None)
        if not names:
            return None
        try:
            parsed = {int(k): str(v) for k, v in dict(names).items()}
        except (TypeError, ValueError):
            return None
        return parsed or None

    def _plate_class_indices(self, result, model):
        names = self._model_names(result, model)
        if names is None:
            # Unknown model metadata (mocks, legacy): keep legacy behavior of
            # returning every box as a plate.
            return None
        matches = {
            int(idx)
            for idx, name in names.items()
            if any(hint in str(name).strip().lower() for hint in PLATE_CLASS_HINTS)
        }
        if not matches:
            logger.debug(
                "No plate class found in model classes %s", names
            )
        return matches

    @staticmethod
    def _is_plate_box(box, plate_classes) -> bool:
        if plate_classes is None:
            return True
        cls_idx = 0
        cls_attr = getattr(box, "cls", None)
        if cls_attr is not None:
            try:
                cls_idx = int(cls_attr[0])
            except (TypeError, ValueError):
                cls_idx = 0
        return cls_idx in plate_classes

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
