import logging
from typing import Optional, Tuple

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class Preprocessing:
    @staticmethod
    def normalize(frame: np.ndarray) -> np.ndarray:
        return frame.astype(np.float32) / 255.0

    @staticmethod
    def denormalize(frame: np.ndarray) -> np.ndarray:
        return np.clip(frame * 255.0, 0, 255).astype(np.uint8)

    @staticmethod
    def crop(
        frame: np.ndarray,
        x: int,
        y: int,
        w: int,
        h: int,
    ) -> Optional[np.ndarray]:
        img_h, img_w = frame.shape[:2]
        x1 = max(0, x)
        y1 = max(0, y)
        x2 = min(img_w, x + w)
        y2 = min(img_h, y + h)
        if x2 <= x1 or y2 <= y1:
            logger.warning(f"Invalid crop region: ({x}, {y}, {w}, {h})")
            return None
        return frame[y1:y2, x1:x2]

    @staticmethod
    def rotate(frame: np.ndarray, angle: float) -> np.ndarray:
        h, w = frame.shape[:2]
        center = (w // 2, h // 2)
        matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(
            frame, matrix, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT
        )

    @staticmethod
    def pad(
        frame: np.ndarray,
        top: int = 0,
        bottom: int = 0,
        left: int = 0,
        right: int = 0,
        color: Tuple[int, int, int] = (0, 0, 0),
    ) -> np.ndarray:
        return cv2.copyMakeBorder(
            frame, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color
        )

    @staticmethod
    def preserve_aspect_ratio(
        frame: np.ndarray, target_w: int, target_h: int, color: Tuple[int, int, int] = (0, 0, 0)
    ) -> np.ndarray:
        h, w = frame.shape[:2]
        scale = min(target_w / w, target_h / h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        resized = cv2.resize(frame, (new_w, new_h), interpolation=cv2.INTER_AREA)
        pad_top = (target_h - new_h) // 2
        pad_bottom = target_h - new_h - pad_top
        pad_left = (target_w - new_w) // 2
        pad_right = target_w - new_w - pad_left
        return Preprocessing.pad(resized, pad_top, pad_bottom, pad_left, pad_right, color)

    @staticmethod
    def flip(frame: np.ndarray, horizontal: bool = True) -> np.ndarray:
        return cv2.flip(frame, 1 if horizontal else 0)
