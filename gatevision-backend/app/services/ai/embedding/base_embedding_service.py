from abc import ABC, abstractmethod
from typing import Optional

import numpy as np


class BaseEmbeddingService(ABC):
    @abstractmethod
    async def extract(self, image: np.ndarray) -> dict:
        ...

    @abstractmethod
    async def extract_batch(self, images: list[np.ndarray]) -> list[dict]:
        ...

    @abstractmethod
    def get_dimension(self) -> int:
        ...

    @abstractmethod
    def get_model_info(self) -> dict:
        ...

    @abstractmethod
    def is_loaded(self) -> bool:
        ...
