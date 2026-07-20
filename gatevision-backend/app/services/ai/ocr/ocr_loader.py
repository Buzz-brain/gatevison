import logging
import threading
from typing import Optional

import easyocr

from app.config.settings import settings
from app.services.ai.registry.model_registry import ModelRegistry

logger = logging.getLogger(__name__)


class OcrLoadError(Exception):
    pass


class OcrLoader:
    _instance: Optional["OcrLoader"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls) -> "OcrLoader":
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self._reader = None
        self._languages: list[str] = ["en"]
        self._device: str = "cpu"
        self._loaded: bool = False
        self._load_lock: threading.Lock = threading.Lock()
        self._registry = ModelRegistry()
        self._initialized = True

    def load(
        self, languages: Optional[list[str]] = None, gpu: Optional[bool] = None
    ) -> object:
        with self._load_lock:
            if self._loaded:
                logger.debug("OCR reader already loaded")
                return self._reader

            resolved_languages = languages or self._resolve_languages()
            use_gpu = gpu if gpu is not None else self._resolve_gpu()

            try:
                logger.info(
                    f"Loading EasyOCR reader: langs={resolved_languages}, "
                    f"gpu={use_gpu}"
                )
                self._reader = easyocr.Reader(
                    resolved_languages, gpu=use_gpu
                )
                self._languages = resolved_languages
                self._device = "gpu" if use_gpu else "cpu"
                self._loaded = True

                self._registry.register(
                    name="easyocr",
                    model=self._reader,
                    model_type="ocr",
                    version=self._extract_version(),
                    device=self._device,
                    metadata={
                        "languages": resolved_languages,
                        "framework": "easyocr",
                        "gpu": use_gpu,
                    },
                )

                logger.info(
                    f"OCR reader loaded: device={self._device}, "
                    f"langs={resolved_languages}"
                )
                return self._reader
            except Exception as e:
                self._loaded = False
                self._reader = None
                raise OcrLoadError(f"Failed to load EasyOCR: {e}") from e

    def unload(self) -> None:
        with self._load_lock:
            if self._reader is not None:
                try:
                    del self._reader
                except Exception:
                    pass
                self._reader = None
            self._loaded = False
            self._device = "cpu"
            self._registry.unregister("easyocr")
            logger.info("OCR reader unloaded")

    def is_loaded(self) -> bool:
        return self._loaded

    def get_reader(self) -> object:
        if not self._loaded or self._reader is None:
            raise OcrLoadError("OCR reader not loaded. Call load() first.")
        return self._reader

    def get_metadata(self) -> dict:
        return {
            "loaded": self._loaded,
            "languages": self._languages,
            "device": self._device,
        }

    def _resolve_languages(self) -> list[str]:
        raw = settings.OCR_LANGUAGES
        return [lang.strip() for lang in raw.split(",") if lang.strip()]

    def _resolve_gpu(self) -> bool:
        gpu_setting = settings.OCR_GPU
        if gpu_setting == "auto":
            try:
                import torch
                return torch.cuda.is_available()
            except ImportError:
                return False
        return gpu_setting.lower() in ("true", "1", "yes")

    def _extract_version(self) -> str:
        try:
            return getattr(easyocr, "__version__", "unknown")
        except ImportError:
            return "unknown"
