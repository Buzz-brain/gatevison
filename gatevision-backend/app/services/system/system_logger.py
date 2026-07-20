import logging
from datetime import datetime, timezone
from typing import Optional

logger = logging.getLogger(__name__)


class SystemLogger:
    def startup(self) -> None:
        logger.info("System startup initiated")

    def shutdown(self) -> None:
        logger.info("System shutdown initiated")

    def critical_error(self, component: str, message: str, error: Optional[str] = None) -> None:
        logger.critical(f"[{component}] {message}", extra={"error": error})

    def config_validation(self, warnings: list[str]) -> None:
        if warnings:
            for w in warnings:
                logger.warning(f"Configuration warning: {w}")
        else:
            logger.info("Configuration validation passed")

    def backup_started(self, backup_type: str, filename: str) -> None:
        logger.info(f"Backup started: type={backup_type}, file={filename}")

    def backup_completed(self, backup_type: str, filename: str, record_count: int) -> None:
        logger.info(f"Backup completed: type={backup_type}, file={filename}, records={record_count}")

    def backup_failed(self, backup_type: str, error: str) -> None:
        logger.error(f"Backup failed: type={backup_type}, error={error}")

    def cleanup_started(self) -> None:
        logger.info("Cleanup operation started")

    def cleanup_completed(self, deleted_files: int, freed_bytes: int) -> None:
        logger.info(f"Cleanup completed: files={deleted_files}, freed={freed_bytes} bytes")

    def model_loaded(self, name: str, device: str, version: str) -> None:
        logger.info(f"Model loaded: {name}, device={device}, version={version}")

    def model_failed(self, name: str, error: str) -> None:
        logger.error(f"Model load failed: {name}, error={error}")


system_logger = SystemLogger()
