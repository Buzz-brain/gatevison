import logging
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class FaceAlignmentError(Exception):
    pass


class FaceAligner:
    def __init__(self, target_size: tuple[int, int] = (112, 112)):
        self.target_size = target_size

    def align(self, image: np.ndarray, landmarks: list[list[float]]) -> np.ndarray:
        if image is None or image.size == 0:
            raise FaceAlignmentError("Empty image provided for alignment")

        if not landmarks or len(landmarks) < 2:
            raise FaceAlignmentError(
                "At least 2 landmarks (eyes) required for alignment"
            )

        left_eye = np.array(landmarks[0], dtype=np.float32)
        right_eye = np.array(landmarks[1], dtype=np.float32)

        dx = right_eye[0] - left_eye[0]
        dy = right_eye[1] - left_eye[1]
        angle = np.degrees(np.arctan2(dy, dx))

        desired_dist = self.target_size[0] * 0.6
        actual_dist = np.sqrt(dx ** 2 + dy ** 2)
        scale = desired_dist / actual_dist if actual_dist > 0 else 1.0

        center = (
            float((left_eye[0] + right_eye[0]) / 2.0),
            float((left_eye[1] + right_eye[1]) / 2.0),
        )

        rot = cv2.getRotationMatrix2D(center, angle, scale)
        tx = self.target_size[0] * 0.5 - center[0]
        ty = self.target_size[1] * 0.4 - center[1]
        rot[0, 2] += tx
        rot[1, 2] += ty

        aligned = cv2.warpAffine(
            image, rot, self.target_size, flags=cv2.INTER_LINEAR,
        )
        return aligned
