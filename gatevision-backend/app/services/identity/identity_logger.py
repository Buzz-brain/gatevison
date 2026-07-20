import logging

logger = logging.getLogger(__name__)


class IdentityLogger:
    def __init__(self, name: str = "identity"):
        self._logger = logging.getLogger(name)

    def log_create(self, entity: str, identifier: str) -> None:
        self._logger.info("Created %s | id=%s", entity, identifier)

    def log_update(self, entity: str, identifier: str) -> None:
        self._logger.info("Updated %s | id=%s", entity, identifier)

    def log_delete(self, entity: str, identifier: str) -> None:
        self._logger.info("Deleted %s | id=%s", entity, identifier)

    def log_link(self, vehicle_id: str, driver_ids: list[str]) -> None:
        self._logger.info("Linked drivers=%s to vehicle=%s", driver_ids, vehicle_id)

    def log_verify(self, plate: str, found: bool) -> None:
        self._logger.info("Verify plate=%s | found=%s", plate, found)

    def log_error(self, operation: str, error: str) -> None:
        self._logger.error("IdentityError | op=%s | error=%s", operation, error)
