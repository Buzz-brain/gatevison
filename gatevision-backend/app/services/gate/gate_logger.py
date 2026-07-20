import logging

logger = logging.getLogger(__name__)


class GateLogger:
    def __init__(self, name: str = "gate"):
        self._logger = logging.getLogger(name)

    def log_entry(self, vehicle_id: str, session_id: str, txn_id: str) -> None:
        self._logger.info(
            "ENTRY | vehicle=%s session=%s txn=%s",
            vehicle_id, session_id, txn_id,
        )

    def log_exit(self, vehicle_id: str, session_id: str, txn_id: str) -> None:
        self._logger.info(
            "EXIT | vehicle=%s session=%s txn=%s",
            vehicle_id, session_id, txn_id,
        )

    def log_rejected(self, vehicle_id: str, reason: str, action: str) -> None:
        self._logger.warning(
            "REJECTED | vehicle=%s action=%s reason=%s",
            vehicle_id, action, reason,
        )

    def log_error(self, operation: str, error: str) -> None:
        self._logger.error("GateError | op=%s | error=%s", operation, error)
