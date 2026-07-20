import logging
import time
from typing import Optional

import cv2
import numpy as np

from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.ocr.ocr_loader import OcrLoader, OcrLoadError
from app.services.ai.ocr.text_cleaner import TextCleaner

logger = logging.getLogger(__name__)


class OcrReadError(Exception):
    pass


class PlateReader:
    def __init__(self, ocr_loader: Optional[OcrLoader] = None):
        self.ocr_loader = ocr_loader or OcrLoader()

    def read(self, image: np.ndarray) -> list[dict]:
        if image is None or image.size == 0:
            raise OcrReadError("Empty image provided for OCR")

        try:
            reader = self.ocr_loader.get_reader()
        except OcrLoadError:
            self.ocr_loader.load()
            reader = self.ocr_loader.get_reader()

        start = time.perf_counter()
        results = reader.readtext(image)
        elapsed = (time.perf_counter() - start) * 1000

        parsed = []
        for bbox, text, conf in results:
            parsed.append({
                "bbox": [int(v) for point in bbox for v in point],
                "text": text,
                "confidence": TextCleaner.normalize_confidence(conf),
                "inference_time_ms": round(elapsed, 2),
            })

        parsed.sort(key=lambda r: r["confidence"], reverse=True)
        return parsed

    def read_from_bytes(self, data: bytes) -> list[dict]:
        frame = FrameProcessor.read_bytes(data)
        if frame is None:
            raise OcrReadError("Failed to decode image from bytes for OCR")
        return self.read(frame)

    def read_from_path(self, path: str) -> list[dict]:
        image = cv2.imread(path)
        if image is None:
            raise OcrReadError(f"Failed to read image from path: {path}")
        return self.read(image)

    def read_first(self, image: np.ndarray) -> Optional[dict]:
        results = self.read(image)
        if not results:
            return None
        return results[0]

    def extract_text(self, image: np.ndarray) -> str:
        results = self.read(image)
        if not results:
            return ""
        return results[0]["text"]
