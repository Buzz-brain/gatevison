import logging
from typing import Optional

import cv2
import numpy as np

from app.services.ai.camera.frame_processor import FrameProcessor

logger = logging.getLogger(__name__)

COLORS = [
    (0, 255, 0),
    (255, 0, 0),
    (0, 0, 255),
    (255, 255, 0),
    (255, 0, 255),
    (0, 255, 255),
]


class Visualization:
    @staticmethod
    def draw_detections(
        frame: np.ndarray,
        detections: list[dict],
        color: Optional[tuple] = None,
    ) -> bytes:
        annotated = frame.copy()

        for i, det in enumerate(detections):
            bbox = det.get("bbox")
            if not bbox or len(bbox) != 4:
                continue

            x1, y1, x2, y2 = bbox
            confidence = det.get("confidence", 0.0)
            box_color = color or COLORS[i % len(COLORS)]

            cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, 2)

            label = f"{confidence:.2f}"
            (label_w, label_h), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
            )
            cv2.rectangle(
                annotated,
                (x1, y1 - label_h - 6),
                (x1 + label_w + 6, y1),
                box_color,
                -1,
            )
            cv2.putText(
                annotated,
                label,
                (x1 + 3, y1 - 3),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2,
            )

        count_label = f"Plates: {len(detections)}"
        cv2.putText(
            annotated,
            count_label,
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2,
        )

        return FrameProcessor.to_bytes(annotated)

    @staticmethod
    def draw_bbox_only(
        frame: np.ndarray, bbox: list[int], color: tuple = (0, 255, 0)
    ) -> bytes:
        annotated = frame.copy()
        x1, y1, x2, y2 = bbox
        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
        return FrameProcessor.to_bytes(annotated)
