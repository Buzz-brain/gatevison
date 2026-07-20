import logging
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)


class VehicleDetectionError(Exception):
    pass


class VehicleDetector:
    def detect(self, image: np.ndarray) -> list[dict]:
        if image is None or image.size == 0:
            raise VehicleDetectionError("Empty image provided")

        return [
            {
                "bbox": [0, 0, image.shape[1], image.shape[0]],
                "confidence": 1.0,
                "vehicle_crop_path": "",
            }
        ]
