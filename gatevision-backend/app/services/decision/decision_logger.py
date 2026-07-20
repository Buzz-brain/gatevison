import logging

logger = logging.getLogger(__name__)


class DecisionLogger:
    def __init__(self, name: str = "decision_engine"):
        self._logger = logging.getLogger(name)

    def log_decision(self, request_id: str, decision: str, confidence: float) -> None:
        self._logger.info(
            "Decision | request=%s | decision=%s | confidence=%.4f",
            request_id, decision, confidence,
        )

    def log_evidence(self, request_id: str, module: str, confidence: float, matched: bool) -> None:
        self._logger.info(
            "Evidence | request=%s | module=%s | confidence=%.4f | matched=%s",
            request_id, module, confidence, matched,
        )

    def log_fusion(self, request_id: str, overall: float, contributions: dict) -> None:
        self._logger.info(
            "Fusion | request=%s | overall=%.4f | contributions=%s",
            request_id, overall, contributions,
        )

    def log_error(self, request_id: str, error: str) -> None:
        self._logger.error(
            "DecisionError | request=%s | error=%s", request_id, error,
        )
