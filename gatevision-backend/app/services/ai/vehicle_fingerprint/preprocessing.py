import logging
from typing import Optional

import cv2
import numpy as np
import torch
from torchvision import transforms

logger = logging.getLogger(__name__)


class PreprocessingError(Exception):
    pass


class VehiclePreprocessor:
    def __init__(self, target_size: tuple[int, int] = (224, 224)):
        self.target_size = target_size
        self._transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

    def preprocess(self, image: np.ndarray) -> torch.Tensor:
        if image is None or image.size == 0:
            raise PreprocessingError("Empty image provided")

        if image.ndim == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        elif image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)

        h, w = image.shape[:2]
        scale = min(self.target_size[0] / h, self.target_size[1] / w)
        new_h, new_w = int(h * scale), int(w * scale)
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        canvas = np.zeros((self.target_size[0], self.target_size[1], 3), dtype=np.uint8)
        canvas[:new_h, :new_w] = resized

        rgb = cv2.cvtColor(canvas, cv2.COLOR_BGR2RGB)
        tensor = self._transform(rgb)
        return tensor.unsqueeze(0)
