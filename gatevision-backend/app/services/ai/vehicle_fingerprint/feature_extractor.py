import logging
import time
from typing import Optional

import numpy as np
import torch

from app.services.ai.embedding.embedding_serializer import EmbeddingSerializer
from app.services.ai.embedding.metrics import get_embedding_metrics
from app.services.ai.vehicle_fingerprint.preprocessing import VehiclePreprocessor
from app.services.ai.vehicle_fingerprint.vehicle_loader import VehicleLoader

logger = logging.getLogger(__name__)


class FeatureExtractError(Exception):
    pass


class VehicleFeatureExtractor:
    def __init__(self):
        self._loader = VehicleLoader()
        self._preprocessor = VehiclePreprocessor()
        self._serializer = EmbeddingSerializer()
        self._metrics = get_embedding_metrics()

    def extract(self, image: np.ndarray) -> dict:
        if not self._loader.is_loaded():
            self._loader.load()

        start = time.time()
        try:
            model = self._loader.get_model()
            device = self._loader.get_device()

            tensor = self._preprocessor.preprocess(image)
            tensor = tensor.to(device)

            with torch.no_grad():
                features = model(tensor)

            embedding = features.cpu().numpy().flatten().tolist()
            duration_ms = (time.time() - start) * 1000

            self._metrics.record_extraction(duration_ms, len(embedding))

            return {
                "embedding": embedding,
                "dimension": len(embedding),
                "duration_ms": round(duration_ms, 2),
            }
        except Exception as e:
            raise FeatureExtractError(f"Feature extraction failed: {e}") from e

    def extract_batch(self, images: list[np.ndarray]) -> list[dict]:
        return [self.extract(img) for img in images]
