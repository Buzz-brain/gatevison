import logging
from typing import Optional


class OcrLogger:
    def __init__(self):
        self._logger = logging.getLogger("gatevision.ocr")

    def ocr_started(self, source: str = "unknown") -> None:
        self._logger.info(f"OCR started | source={source}")

    def ocr_completed(
        self, text: str, confidence: float, time_ms: float
    ) -> None:
        self._logger.info(
            f"OCR completed | text='{text}' | conf={confidence:.4f} | "
            f"time_ms={time_ms:.2f}"
        )

    def validation_result(
        self, status: str, message: str = ""
    ) -> None:
        self._logger.info(f"Validation | status={status} | msg='{message}'")

    def invalid_format(self, text: str) -> None:
        self._logger.warning(f"Invalid plate format | text='{text}'")

    def no_text_detected(self) -> None:
        self._logger.warning("No text detected in image")

    def image_error(self, reason: str = "unknown") -> None:
        self._logger.error(f"Image error: {reason}")

    def ocr_failure(self, error: str) -> None:
        self._logger.error(f"OCR failure: {error}")

    def model_loaded(self, languages: list[str], device: str) -> None:
        self._logger.info(
            f"OCR model loaded | langs={languages} | device={device}"
        )

    def model_unloaded(self) -> None:
        self._logger.info("OCR model unloaded")
