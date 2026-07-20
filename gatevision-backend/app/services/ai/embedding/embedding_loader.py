import logging
from typing import Any, Optional

from app.services.ai.registry.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class EmbeddingLoadError(Exception):
    pass


class EmbeddingModelLoader:
    def __init__(self, name: str):
        self._name = name
        self._model: Optional[Any] = None
        self._loaded = False

    def load(self, model: Any, metadata: Optional[dict] = None) -> Any:
        if self._loaded:
            logger.debug("Model '%s' already loaded", self._name)
            return self._model
        self._model = model
        self._loaded = True
        registry = ModelRegistry()
        registry.register(
            name=self._name,
            model=model,
            model_type="embedding",
            metadata=metadata or {},
        )
        logger.info("Model '%s' registered with registry", self._name)
        return self._model

    def unload(self) -> None:
        self._model = None
        self._loaded = False
        ModelRegistry().unregister(self._name)
        logger.info("Model '%s' unloaded", self._name)

    def get_model(self) -> Any:
        if not self._loaded or self._model is None:
            raise EmbeddingLoadError(f"Model '{self._name}' not loaded")
        return self._model

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def name(self) -> str:
        return self._name
