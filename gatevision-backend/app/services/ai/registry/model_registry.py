import logging
import threading
import time
from typing import Any, Optional

from app.services.ai.registry.model_info import ModelInfo

logger = logging.getLogger(__name__)


class RegistryError(Exception):
    pass


class ModelRegistry:
    _instance: Optional["ModelRegistry"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls) -> "ModelRegistry":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._models: dict[str, Any] = {}
        self._infos: dict[str, ModelInfo] = {}
        self._registry_lock: threading.Lock = threading.Lock()
        self._initialized = True

    def register(
        self,
        name: str,
        model: Any,
        model_type: str,
        version: str = "unknown",
        device: str = "cpu",
        model_path: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> ModelInfo:
        with self._registry_lock:
            if name in self._models:
                logger.warning(f"Model '{name}' already registered. Overwriting.")

            memory = self._estimate_memory(model)
            info = ModelInfo(
                name=name,
                model_type=model_type,
                version=version,
                device=device,
                loaded=True,
                model_path=model_path,
                memory_mb=memory,
                metadata=metadata or {},
            )
            self._models[name] = model
            self._infos[name] = info
            logger.info(f"Registered model '{name}' ({model_type}) on {device}")
            return info

    def unregister(self, name: str) -> bool:
        with self._registry_lock:
            if name not in self._models:
                logger.warning(f"Model '{name}' not found in registry")
                return False
            try:
                del self._models[name]
            except Exception:
                pass
            if name in self._infos:
                self._infos[name].loaded = False
                self._infos[name].error = "unloaded"
            logger.info(f"Unregistered model '{name}'")
            return True

    def get_model(self, name: str) -> Any:
        if name not in self._models:
            raise RegistryError(f"Model '{name}' not loaded. Register it first.")
        return self._models[name]

    def get_info(self, name: str) -> Optional[ModelInfo]:
        return self._infos.get(name)

    def get_all_infos(self) -> list[ModelInfo]:
        return list(self._infos.values())

    def is_loaded(self, name: str) -> bool:
        info = self._infos.get(name)
        return info is not None and info.loaded

    def update_info(self, name: str, **kwargs) -> None:
        with self._registry_lock:
            if name in self._infos:
                for key, value in kwargs.items():
                    if hasattr(self._infos[name], key):
                        setattr(self._infos[name], key, value)

    def health_check(self) -> dict:
        results = {}
        for name, info in self._infos.items():
            results[name] = {
                "healthy": info.loaded,
                "model_type": info.model_type,
                "device": info.device,
                "error": info.error,
            }
        return results

    def health_summary(self) -> dict:
        infos = self.get_all_infos()
        total = len(infos)
        loaded = sum(1 for i in infos if i.loaded)
        return {
            "total_models": total,
            "loaded_models": loaded,
            "healthy": loaded == total if total > 0 else False,
            "timestamp": time.time(),
        }

    def unload_all(self) -> int:
        count = 0
        for name in list(self._models.keys()):
            try:
                del self._models[name]
            except Exception:
                pass
            if name in self._infos:
                self._infos[name].loaded = False
                self._infos[name].error = "unloaded"
            count += 1
        logger.info(f"Unloaded all {count} models from registry")
        return count

    def _estimate_memory(self, model: Any) -> Optional[float]:
        try:
            import sys
            size = sys.getsizeof(model)
            return round(size / (1024 * 1024), 2)
        except Exception:
            return None
