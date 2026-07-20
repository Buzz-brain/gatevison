import logging
from typing import Optional

logger = logging.getLogger(__name__)


class FingerprintLogger:
    def __init__(self, name: str = "vehicle_fingerprint"):
        self._logger = logging.getLogger(name)

    def log_extraction(self, plate_text: Optional[str], dim: int, duration_ms: float) -> None:
        self._logger.info(
            "Extraction | plate=%s | dim=%d | duration=%.2fms",
            plate_text or "unknown", dim, duration_ms,
        )

    def log_lookup(self, plate_text: Optional[str], matches: int) -> None:
        self._logger.info(
            "Lookup | plate=%s | matches=%d",
            plate_text or "unknown", matches,
        )

    def log_verify(self, plate_text: str, score: float, is_match: bool) -> None:
        self._logger.info(
            "Verify | plate=%s | score=%.4f | match=%s",
            plate_text, score, is_match,
        )

    def log_store(self, plate_text: str, dim: int) -> None:
        self._logger.info(
            "Store | plate=%s | dim=%d", plate_text, dim,
        )

    def log_error(self, operation: str, error: str) -> None:
        self._logger.error("Error | op=%s | error=%s", operation, error)
