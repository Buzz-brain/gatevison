import logging
from abc import ABC, abstractmethod
from typing import Any, Optional

import numpy as np

logger = logging.getLogger(__name__)


class BaseAIService(ABC):
    def __init__(self):
        self._model = None
        self._loaded: bool = False
        self._model_name: str = self.__class__.__name__

    @abstractmethod
    async def load_model(self) -> None:
        ...

    @abstractmethod
    async def predict(self, frame: np.ndarray) -> dict[str, Any]:
        ...

    async def ensure_loaded(self) -> None:
        if not self._loaded:
            logger.info(f"Loading model: {self._model_name}")
            await self.load_model()
            self._loaded = True
            logger.info(f"Model loaded: {self._model_name}")

    def validate_input(self, frame: np.ndarray) -> bool:
        if frame is None or frame.size == 0:
            logger.error(f"{self._model_name}: Empty frame received")
            return False
        if len(frame.shape) not in (2, 3):
            logger.error(f"{self._model_name}: Invalid frame dimensions: {frame.shape}")
            return False
        return True

    def is_loaded(self) -> bool:
        return self._loaded

    async def unload_model(self) -> None:
        self._model = None
        self._loaded = False
        logger.info(f"Model unloaded: {self._model_name}")
