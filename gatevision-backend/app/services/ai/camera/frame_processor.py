import logging
from typing import Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class FrameProcessor:
    @staticmethod
    def read_bytes(image_bytes: bytes) -> Optional[np.ndarray]:
        array = np.frombuffer(image_bytes, dtype=np.uint8)
        frame = cv2.imdecode(array, cv2.IMREAD_COLOR)
        if frame is None:
            logger.warning("Failed to decode image bytes")
        return frame

    @staticmethod
    def to_bytes(frame: np.ndarray, ext: str = ".jpg") -> bytes:
        success, buffer = cv2.imencode(ext, frame)
        if not success:
            raise ValueError("Failed to encode frame to bytes")
        return buffer.tobytes()

    @staticmethod
    def resize(frame: np.ndarray, width: int, height: int) -> np.ndarray:
        return cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)

    @staticmethod
    def resize_by_max(frame: np.ndarray, max_dim: int = 1280) -> np.ndarray:
        h, w = frame.shape[:2]
        if max(h, w) <= max_dim:
            return frame
        scale = max_dim / max(h, w)
        new_w = int(w * scale)
        new_h = int(h * scale)
        return cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)

    @staticmethod
    def bgr_to_rgb(frame: np.ndarray) -> np.ndarray:
        return cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    @staticmethod
    def rgb_to_bgr(frame: np.ndarray) -> np.ndarray:
        return cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)

    @staticmethod
    def to_grayscale(frame: np.ndarray) -> np.ndarray:
        if len(frame.shape) == 3:
            return cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return frame

    @staticmethod
    def adjust_brightness(frame: np.ndarray, value: int = 30) -> np.ndarray:
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV).astype(np.int16)
        hsv[:, :, 2] = np.clip(hsv[:, :, 2] + value, 0, 255)
        return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

    @staticmethod
    def adjust_contrast(frame: np.ndarray, alpha: float = 1.5) -> np.ndarray:
        return cv2.convertScaleAbs(frame, alpha=alpha, beta=0)

    @staticmethod
    def blur_detection(frame: np.ndarray, threshold: float = 100.0) -> dict:
        gray = FrameProcessor.to_grayscale(frame)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        return {
            "is_blurry": laplacian_var < threshold,
            "laplacian_variance": round(laplacian_var, 2),
            "threshold": threshold,
        }

    @staticmethod
    def get_resolution(frame: np.ndarray) -> Tuple[int, int]:
        h, w = frame.shape[:2]
        return w, h

    @staticmethod
    def validate_resolution(
        frame: np.ndarray, min_w: int = 320, min_h: int = 240
    ) -> dict:
        w, h = FrameProcessor.get_resolution(frame)
        valid = w >= min_w and h >= min_h
        return {
            "valid": valid,
            "width": w,
            "height": h,
            "min_required_width": min_w,
            "min_required_height": min_h,
        }

    @staticmethod
    def quality_score(frame: np.ndarray) -> dict:
        gray = FrameProcessor.to_grayscale(frame)
        h, w = gray.shape
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        mean_brightness = float(np.mean(gray))
        resolution_score = min(1.0, (w * h) / (1920 * 1080))
        sharpness_score = min(1.0, laplacian_var / 500.0)
        brightness_score = 1.0 - abs(mean_brightness - 127) / 127.0
        overall = round(
            (resolution_score * 0.3 + sharpness_score * 0.4 + brightness_score * 0.3)
            * 100,
            2,
        )
        return {
            "overall": overall,
            "resolution_score": round(resolution_score * 100, 2),
            "sharpness_score": round(sharpness_score * 100, 2),
            "brightness_score": round(brightness_score * 100, 2),
            "laplacian_variance": round(laplacian_var, 2),
            "mean_brightness": round(mean_brightness, 2),
        }
