import logging
import threading
import time
from typing import Optional

import cv2
import numpy as np

from app.config.settings import settings
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.ocr.ocr_loader import OcrLoader, OcrLoadError
from app.services.ai.ocr.plate_validator import NigeriaPlateValidator
from app.services.ai.ocr.text_cleaner import TextCleaner

logger = logging.getLogger(__name__)


class OcrReadError(Exception):
    pass


class PlateReader:
    def __init__(self, ocr_loader: Optional[OcrLoader] = None):
        self.ocr_loader = ocr_loader or OcrLoader()
        # The EasyOCR reader is not thread-safe; serialize inference so
        # concurrent pipeline requests (which now run in worker threads) cannot
        # corrupt the shared reader.
        self._lock = threading.Lock()

    def _get_reader(self):
        try:
            return self.ocr_loader.get_reader()
        except OcrLoadError:
            self.ocr_loader.load()
            return self.ocr_loader.get_reader()

    def _preprocess(self, image: np.ndarray) -> Optional[np.ndarray]:
        """Downscale oversized crops and drop blurry ones (cheap pre-checks)."""
        if image is None or image.size == 0:
            return None

        max_dim = settings.OCR_MAX_IMAGE_DIM
        h, w = image.shape[:2]
        if max_dim and max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            image = cv2.resize(
                image,
                (int(round(w * scale)), int(round(h * scale))),
                interpolation=cv2.INTER_AREA,
            )

        if settings.OCR_SKIP_BLURRY_CROPS:
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image
            if gray.size == 0:
                return None
            variance = cv2.Laplacian(gray, cv2.CV_64F).var()
            if variance < settings.OCR_BLUR_LAPLACIAN_THRESHOLD:
                return None

        return image

    def _readtext_kwargs(self) -> dict:
        kwargs = {
            "decoder": settings.OCR_FAST_DECODER or "greedy",
            "beamWidth": max(1, int(settings.OCR_BEAM_WIDTH or 1)),
        }
        allowlist = (settings.OCR_ALLOWLIST or "").strip()
        if allowlist:
            kwargs["allowlist"] = allowlist
        return kwargs

    @staticmethod
    def _parse_results(results, elapsed_ms: float) -> list[dict]:
        parsed = []
        for bbox, text, conf in results:
            parsed.append({
                "bbox": [int(v) for point in bbox for v in point],
                "text": text,
                "confidence": TextCleaner.normalize_confidence(conf),
                "inference_time_ms": round(elapsed_ms, 2),
            })
        parsed.sort(key=lambda r: r["confidence"], reverse=True)
        return parsed

    @staticmethod
    def pick_best(results: list[dict]) -> Optional[dict]:
        """Pick the most plate-like reading for a single crop.

        EasyOCR can return several text boxes inside one plate detection (for
        example a "UNIVERSITY OF LAGOS" poster behind a bus plus the actual
        plate "KJA 987FT"). The highest-confidence box is therefore NOT
        necessarily the plate. Prefer the first reading (highest confidence)
        that matches a known plate format; otherwise fall back to the
        highest-confidence reading.
        """
        if not results:
            return None
        validator = NigeriaPlateValidator()
        for r in results:
            cleaned = TextCleaner.clean(r.get("text", ""))
            if validator.validate(cleaned).valid:
                return r
        return results[0]

    def read(self, image: np.ndarray) -> list[dict]:
        if image is None or image.size == 0:
            raise OcrReadError("Empty image provided for OCR")

        reader = self._get_reader()
        prepared = self._preprocess(image)
        if prepared is None:
            return []

        start = time.perf_counter()
        try:
            with self._lock:
                results = reader.readtext(prepared, **self._readtext_kwargs())
        except Exception as e:
            raise OcrReadError(f"OCR inference failed: {e}") from e
        elapsed = (time.perf_counter() - start) * 1000

        return self._parse_results(results, elapsed)

    def read_many(self, images: list[np.ndarray]) -> list[list[dict]]:
        """OCR many crops sequentially, reusing the loaded reader."""
        if not images:
            return []

        reader = self._get_reader()
        results_out: list[list[dict]] = []
        for i, img in enumerate(images):
            if img is None or img.size == 0:
                logger.info(
                    "OCR crop skipped (empty image) | event=ocr_crop_empty "
                    "| crop_index=%s",
                    i,
                )
                results_out.append([])
                continue
            prepped = self._preprocess(img)
            if prepped is None:
                logger.info(
                    "OCR crop skipped (blurry or downscale-null) "
                    "| event=ocr_crop_blurry | crop_index=%s | src_size=%sx%s",
                    i, img.shape[1], img.shape[0],
                )
                results_out.append([])
                continue
            start = time.perf_counter()
            try:
                with self._lock:
                    results = reader.readtext(prepped, **self._readtext_kwargs())
            except Exception as e:
                logger.warning("OCR failed for crop: %s", e)
                results_out.append([])
                continue
            elapsed = (time.perf_counter() - start) * 1000
            parsed = self._parse_results(results, elapsed)
            logger.info(
                "OCR inference | event=ocr_inference | crop_index=%s "
                "| input_size=%sx%s | prepared_size=%sx%s | results=%s "
                "| top=%r | elapsed_ms=%.0f",
                i, img.shape[1], img.shape[0],
                prepped.shape[1], prepped.shape[0],
                len(parsed),
                parsed[0]["text"] if parsed else None,
                elapsed,
            )
            results_out.append(parsed)

        return results_out

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
        return self.pick_best(results)

    def extract_text(self, image: np.ndarray) -> str:
        results = self.read(image)
        if not results:
            return ""
        best = self.pick_best(results)
        return best["text"] if best else ""
