import logging
import threading
from typing import Optional

import torch
import torchvision.models as models
from torch import nn

from app.config.settings import settings
from app.services.ai.registry.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class VehicleModelError(Exception):
    pass


class VehicleLoader:
    _instance: Optional["VehicleLoader"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls) -> "VehicleLoader":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._model: Optional[nn.Module] = None
        self._loaded: bool = False
        self._device: torch.device = torch.device("cpu")
        self._model_name: str = "resnet50"
        self._embedding_dim: int = 2048
        self._load_lock: threading.Lock = threading.Lock()
        self._registry = ModelRegistry()
        self._initialized = True

    def load(
        self, model_name: Optional[str] = None, device: Optional[str] = None,
    ) -> nn.Module:
        with self._load_lock:
            if self._loaded:
                logger.debug("Vehicle model already loaded")
                return self._model

            resolved_name = model_name or settings.VEHICLE_MODEL_NAME
            use_gpu = self._resolve_device(device)

            try:
                self._device = torch.device("cuda:0" if use_gpu else "cpu")
                logger.info(
                    f"Loading vehicle model: {resolved_name} on {self._device}"
                )

                weights = models.ResNet50_Weights.IMAGENET1K_V2
                full_model = models.resnet50(weights=weights)
                full_model.eval()

                feature_extractor = nn.Sequential(*list(full_model.children())[:-1])
                feature_extractor.eval()
                self._model = feature_extractor.to(self._device)

                self._model_name = resolved_name
                self._loaded = True

                self._registry.register(
                    name="resnet50",
                    model=self._model,
                    model_type="vehicle_fingerprint",
                    version=torch.__version__,
                    device=str(self._device),
                    metadata={
                        "model_name": resolved_name,
                        "framework": "torch",
                        "embedding_dim": self._embedding_dim,
                    },
                )

                logger.info(
                    f"Vehicle model loaded: device={self._device}, "
                    f"model={resolved_name}, dim={self._embedding_dim}"
                )
                return self._model

            except Exception as e:
                self._loaded = False
                self._model = None
                raise VehicleModelError(
                    f"Failed to load vehicle model: {e}"
                ) from e

    def unload(self) -> None:
        with self._load_lock:
            self._model = None
            self._loaded = False
            self._registry.unregister("resnet50")
            logger.info("Vehicle model unloaded")

    def is_loaded(self) -> bool:
        return self._loaded

    def get_model(self) -> nn.Module:
        if not self._loaded or self._model is None:
            raise VehicleModelError(
                "Vehicle model not loaded. Call load() first."
            )
        return self._model

    def get_device(self) -> torch.device:
        return self._device

    def get_metadata(self) -> dict:
        return {
            "loaded": self._loaded,
            "model_name": self._model_name,
            "device": str(self._device),
            "embedding_dim": self._embedding_dim,
        }

    def _resolve_device(self, device: Optional[str] = None) -> bool:
        resolved = (device or settings.VEHICLE_DEVICE).lower()
        if resolved == "auto":
            return torch.cuda.is_available()
        return resolved in ("true", "1", "yes", "gpu")
