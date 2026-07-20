import logging
import uuid
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

from app.config.settings import settings
from app.services.ai.face_recognition.face_loader import FaceLoader, FaceLoadError

logger = logging.getLogger(__name__)


class FaceDetectionError(Exception):
    pass


class FaceDetector:
    def __init__(self, loader: Optional[FaceLoader] = None):
        self._loader = loader or FaceLoader()

    def detect(self, image: np.ndarray) -> list[dict]:
        if image is None or image.size == 0:
            raise FaceDetectionError("Empty image provided for face detection")

        try:
            app = self._loader.get_app()
        except FaceLoadError:
            self._loader.load()
            app = self._loader.get_app()

        faces = app.get(image)
        if not faces:
            return []

        results = []
        for face in faces:
            bbox = face.bbox.astype(int).tolist() if hasattr(face.bbox, "astype") else face.bbox
            landmarks = face.kps.astype(float).tolist() if hasattr(face.kps, "astype") else face.kps

            results.append({
                "bbox": [int(v) for v in bbox],
                "confidence": float(face.det_score),
                "landmarks": [[float(p) for p in pt] for pt in landmarks],
                "embedding": face.embedding,
            })

        return results

    def detect_and_crop(
        self, image: np.ndarray, save_dir: Optional[str] = None,
    ) -> list[dict]:
        faces = self.detect(image)
        save_path = Path(save_dir or settings.UPLOAD_DIR) / "faces"
        save_path.mkdir(parents=True, exist_ok=True)

        for face in faces:
            bbox = face["bbox"]
            x1, y1, x2, y2 = max(0, bbox[0]), max(0, bbox[1]), bbox[2], bbox[3]
            x2 = min(image.shape[1], x2)
            y2 = min(image.shape[0], y2)

            if x2 > x1 and y2 > y1:
                crop = image[y1:y2, x1:x2]
                filename = f"{uuid.uuid4().hex}.jpg"
                filepath = save_path / filename
                cv2.imwrite(str(filepath), crop)
                face["cropped_face_path"] = str(filepath)
            else:
                face["cropped_face_path"] = ""

        return faces
