import logging
import sys
from pathlib import Path

from app.config.settings import settings

_LOG_FIELDS = ("request_id", "event", "stage", "duration_ms", "decision", "error", "model")


class StructuredFormatter(logging.Formatter):
    """Include structured extra fields (request_id, stage timings, decision) in every line."""

    def format(self, record: logging.LogRecord) -> str:
        base = super().format(record)
        parts = []
        for key in _LOG_FIELDS:
            value = getattr(record, key, None)
            if value is not None:
                parts.append(f"{key}={value}")
        return f"{base} {(' | '.join(parts))}" if parts else base


def setup_logging():
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(exist_ok=True)

    formatter = StructuredFormatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    app_handler = logging.FileHandler(log_dir / "app.log")
    app_handler.setFormatter(formatter)
    app_handler.setLevel(logging.INFO)

    error_handler = logging.FileHandler(log_dir / "error.log")
    error_handler.setFormatter(formatter)
    error_handler.setLevel(logging.ERROR)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(app_handler)
    root_logger.addHandler(error_handler)
    root_logger.addHandler(console_handler)

    return root_logger
