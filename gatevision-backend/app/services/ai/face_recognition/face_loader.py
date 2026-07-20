import logging
import threading
from typing import Optional

import insightface
from insightface.app import FaceAnalysis

from app.config.settings import settings
from app.services.ai.registry.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class FaceLoadError(Exception):
    pass


class FaceLoader:
    _instance: Optional["FaceLoader"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls) -> "FaceLoader":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._app: Optional[FaceAnalysis] = None
        self._loaded: bool = False
        self._device: str = "cpu"
        self._model_name: str = "buffalo_l"
        self._load_lock: threading.Lock = threading.Lock()
        self._registry = ModelRegistry()
        self._initialized = True

    def load(
        self, model_name: Optional[str] = None, device: Optional[str] = None,
    ) -> FaceAnalysis:
        with self._load_lock:
            if self._loaded:
                logger.debug("Face model already loaded")
                return self._app

            resolved_name = model_name or settings.FACE_MODEL_NAME
            use_gpu = self._resolve_device(device)

            try:
                ctx_id = 0 if use_gpu else -1
                logger.info(
                    f"Loading InsightFace: model={resolved_name}, ctx_id={ctx_id}"
                )
                self._app = FaceAnalysis(name=resolved_name)
                self._app.prepare(ctx_id=ctx_id)
                self._model_name = resolved_name
                self._device = "gpu" if use_gpu else "cpu"
                self._loaded = True

                self._registry.register(
                    name="insightface",
                    model=self._app,
                    model_type="face_recognition",
                    version=insightface.__version__,
                    device=self._device,
                    metadata={
                        "model_name": resolved_name,
                        "framework": "insightface",
                        "gpu": use_gpu,
                    },
                )

                logger.info(
                    f"Face model loaded: device={self._device}, "
                    f"model={resolved_name}"
                )
                return self._app

            except Exception as e:
                self._loaded = False
                self._app = None
                raise FaceLoadError(f"Failed to load InsightFace: {e}") from e

    def unload(self) -> None:
        with self._load_lock:
            self._app = None
            self._loaded = False
            self._device = "cpu"
            self._registry.unregister("insightface")
            logger.info("Face model unloaded")

    def is_loaded(self) -> bool:
        return self._loaded

    def get_app(self) -> FaceAnalysis:
        if not self._loaded or self._app is None:
            raise FaceLoadError(
                "InsightFace not loaded. Call load() first."
            )
        return self._app

    def get_metadata(self) -> dict:
        return {
            "loaded": self._loaded,
            "model_name": self._model_name,
            "device": self._device,
            "version": insightface.__version__,
        }

    def _resolve_device(self, device: Optional[str] = None) -> bool:
        resolved = (device or settings.FACE_DEVICE).lower()
        if resolved == "auto":
            return self._detect_gpu()
        return resolved in ("true", "1", "yes", "gpu")

    @staticmethod
    def _detect_gpu() -> bool:
        try:
            import torch
            return torch.cuda.is_available()
        except ImportError:
            return False
