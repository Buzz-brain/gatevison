import logging
import time

import numpy as np

from app.config.settings import settings
from app.services.ai.ocr.ocr_loader import OcrLoader
from app.services.ai.plate_detection.model_loader import ModelLoader

logger = logging.getLogger(__name__)


def warm_up_models() -> dict:
    """Pre-load all AI models at startup so the first request is fast.

    Runs a tiny warm-up inference for each model so graph/JIT initialization
    cost is not paid on the first real request. Failures are logged and
    reported, but never crash startup. Progress is logged with structured
    fields so startup warm-up is visible in the console.
    """
    report: dict = {"warm_up": False, "models": {}}

    if not settings.MODEL_WARMUP_ENABLED:
        logger.info("Model warm-up disabled via settings")
        return report

    logger.info(
        "Warm-up: starting plate detector + OCR",
        extra={"request_id": "startup", "event": "warmup_started"},
    )

    try:
        t0 = time.perf_counter()
        model = ModelLoader().load()
        model(np.zeros((64, 64, 3), dtype=np.uint8), conf=settings.PLATE_DETECTION_CONFIDENCE, verbose=False)
        elapsed = (time.perf_counter() - t0) * 1000
        report["models"]["plate_detector"] = {"loaded": True, "load_ms": round(elapsed, 2)}
        logger.info(
            "Warm-up: plate detector ready (%.2fms)", elapsed,
            extra={
                "request_id": "startup",
                "event": "warmup_model_ready",
                "model": "plate_detector",
                "duration_ms": round(elapsed, 2),
            },
        )
    except Exception as e:
        report["models"]["plate_detector"] = {"loaded": False, "error": str(e)}
        logger.error(
            "Warm-up: plate detector failed: %s", e,
            extra={
                "request_id": "startup",
                "event": "warmup_model_failed",
                "model": "plate_detector",
                "error": str(e),
            },
        )

    try:
        t0 = time.perf_counter()
        reader = OcrLoader().load()
        reader.readtext(np.zeros((64, 64, 3), dtype=np.uint8), detail=1, paragraph=False)
        elapsed = (time.perf_counter() - t0) * 1000
        report["models"]["ocr"] = {"loaded": True, "load_ms": round(elapsed, 2)}
        logger.info(
            "Warm-up: OCR reader ready (%.2fms)", elapsed,
            extra={
                "request_id": "startup",
                "event": "warmup_model_ready",
                "model": "ocr",
                "duration_ms": round(elapsed, 2),
            },
        )
    except Exception as e:
        report["models"]["ocr"] = {"loaded": False, "error": str(e)}
        logger.error(
            "Warm-up: OCR reader failed: %s", e,
            extra={
                "request_id": "startup",
                "event": "warmup_model_failed",
                "model": "ocr",
                "error": str(e),
            },
        )

    report["warm_up"] = any(m.get("loaded") for m in report["models"].values())
    return report
