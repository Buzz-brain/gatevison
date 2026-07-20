import logging
from typing import Optional

logger = logging.getLogger(__name__)


class DetectionLogger:
    def __init__(self):
        self._logger = logging.getLogger("gatevision.detection")

    def detection_started(self, source: str = "unknown") -> None:
        self._logger.info(f"Detection started | source={source}")

    def detection_completed(
        self, plate_count: int, total_time_ms: float
    ) -> None:
        self._logger.info(
            f"Detection completed | plates={plate_count} | "
            f"time_ms={total_time_ms:.2f}"
        )

    def plate_found(
        self,
        confidence: float,
        bbox: list[int],
        inference_ms: float,
    ) -> None:
        self._logger.info(
            f"Plate detected | conf={confidence:.4f} | "
            f"bbox={bbox} | inference_ms={inference_ms:.2f}"
        )

    def model_loaded(self, model_path: str, device: str) -> None:
        self._logger.info(f"Model loaded | path={model_path} | device={device}")

    def model_unloaded(self) -> None:
        self._logger.info("Model unloaded")

    def model_error(self, error: str) -> None:
        self._logger.error(f"Model error: {error}")

    def no_plate_detected(self) -> None:
        self._logger.warning("No license plate detected")

    def invalid_image(self, reason: str = "unknown") -> None:
        self._logger.warning(f"Invalid image provided: {reason}")

    def crop_saved(self, path: str) -> None:
        self._logger.info(f"Cropped plate saved: {path}")

    def camera_error(self, error: str) -> None:
        self._logger.error(f"Camera error during detection: {error}")
