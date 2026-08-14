import logging
import threading
from pathlib import Path
from typing import Optional

from ultralytics import YOLO, __version__ as ultralytics_version

from app.config.settings import settings
from app.services.ai.registry.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class ModelLoadError(Exception):
    pass


class ModelLoader:
    _instance: Optional["ModelLoader"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls) -> "ModelLoader":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._model = None
        self._model_path: Optional[str] = None
        self._device: str = "cpu"
        self._loaded: bool = False
        self._model_version: str = "unknown"
        self._load_lock: threading.Lock = threading.Lock()
        self._registry = ModelRegistry()
        self._initialized = True

    def load(
        self, model_path: Optional[str] = None, device: Optional[str] = None
    ) -> object:
        with self._load_lock:
            resolved_path = model_path or settings.YOLO_MODEL_PATH
            resolved_device = device or settings.DEVICE

            if self._loaded and self._model_path == resolved_path:
                logger.debug(f"Model already loaded: {resolved_path}")
                return self._model

            if not Path(resolved_path).exists():
                raise ModelLoadError(
                    f"Model file not found: {resolved_path}. "
                    f"Set YOLO_MODEL_PATH in .env to a valid model path."
                )

            try:
                logger.info(f"Loading YOLO model from: {resolved_path}")
                self._model = YOLO(resolved_path)
                resolved_device = self._resolve_device(resolved_device)
                self._model.to(resolved_device)
                self._model_path = resolved_path
                self._device = resolved_device
                self._loaded = True
                self._model_version = self._extract_version()

                self._registry.register(
                    name="yolo",
                    model=self._model,
                    model_type="object_detection",
                    version=self._model_version,
                    device=resolved_device,
                    model_path=resolved_path,
                    metadata={"framework": "ultralytics", "task": "detect"},
                )

                logger.info(
                    f"Model loaded: device={resolved_device}, "
                    f"version={self._model_version}"
                )
                try:
                    class_names = self._model.names
                    if class_names:
                        logger.info(
                            "YOLO model classes: %s | event=model_classes",
                            class_names,
                        )
                    plate_classes = [
                        str(n).strip().lower()
                        for n in class_names.values()
                        if "plate" in str(n).strip().lower()
                        or "licence" in str(n).strip().lower()
                        or "license" in str(n).strip().lower()
                    ]
                    logger.info(
                        "YOLO plate classes: %s | event=model_plate_classes",
                        plate_classes or "NONE - not a plate detector",
                    )
                except Exception as e:
                    logger.debug("Could not read model class names: %s", e)
                return self._model
            except ModelLoadError:
                raise
            except Exception as e:
                self._loaded = False
                self._model = None
                raise ModelLoadError(f"Failed to load model: {e}") from e

    def unload(self) -> None:
        with self._load_lock:
            if self._model is not None:
                try:
                    del self._model
                except Exception:
                    pass
                self._model = None
            self._loaded = False
            self._model_path = None
            self._device = "cpu"
            self._registry.unregister("yolo")
            logger.info("Model unloaded")

    def is_loaded(self) -> bool:
        return self._loaded

    def get_model(self) -> object:
        if not self._loaded or self._model is None:
            raise ModelLoadError("Model not loaded. Call load() first.")
        return self._model

    def get_metadata(self) -> dict:
        path = self._model_path or settings.YOLO_MODEL_PATH
        return {
            "loaded": self._loaded,
            "model_path": path,
            "device": self._device,
            "model_version": self._model_version,
        }

    def health_check(self) -> dict:
        return {
            "healthy": self._loaded,
            "model_path": self._model_path,
            "device": self._device,
        }

    def _resolve_device(self, device: str) -> str:
        if device == "auto":
            try:
                import torch
                if torch.cuda.is_available():
                    return "cuda:0"
                return "cpu"
            except ImportError:
                return "cpu"
        return device

    def _extract_version(self) -> str:
        return ultralytics_version
