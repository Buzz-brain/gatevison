import logging
from typing import Optional

from app.models.gate_session import GateSession
from app.models.gate_transaction import GateTransaction
from app.services.ai.orchestrator.pipeline_result import PipelineResult
from app.services.gate.active_session_matcher import ActiveSessionMatcher, MatchResult
from app.services.gate.gate_logger import GateLogger
from app.services.gate.session_service import SessionError, SessionService
from app.services.gate.session_verification_service import (
    SessionVerificationResult,
    SessionVerificationService,
)
from app.services.gate.transaction_service import TransactionService

logger = logging.getLogger(__name__)


class SessionGateError(Exception):
    pass


class SessionGateService:
    """Mode A (Session Verification) gate workflow.

    Entry: signals captured at the gate are verified for quality and an entry
    session is created keyed on the observed plate, storing the vehicle / face
    embeddings for later exit matching.
    Exit: the captured signals are matched against active sessions via
    ActiveSessionMatcher; on a match the session is closed.
    """

    def __init__(
        self,
        session_service: Optional[SessionService] = None,
        transaction_service: Optional[TransactionService] = None,
        matcher: Optional[ActiveSessionMatcher] = None,
        verification_service: Optional[SessionVerificationService] = None,
    ):
        self._sessions = session_service or SessionService()
        self._transactions = transaction_service or TransactionService()
        self._matcher = matcher or ActiveSessionMatcher()
        self._verification = (
            verification_service or SessionVerificationService()
        )
        self._log = GateLogger()

    async def create_entry_session(
        self,
        plate_text: str,
        request_id: Optional[str] = None,
        gate_name: str = "Main Gate",
        notes: Optional[str] = None,
        face_embedding: Optional[list[float]] = None,
        vehicle_embedding: Optional[list[float]] = None,
        face_confidence: Optional[float] = None,
        vehicle_confidence: Optional[float] = None,
        decision: str = "GRANT",
        verification: Optional[SessionVerificationResult] = None,
    ) -> tuple[GateSession, GateTransaction]:
        if decision != "GRANT":
            raise SessionGateError(
                f"Cannot create entry session: decision is '{decision}', "
                f"only GRANT allowed"
            )

        try:
            session = await self._sessions.open_session(
                vehicle_id=plate_text,
                plate_text=plate_text,
                vehicle_embedding=vehicle_embedding,
                face_embedding=face_embedding,
                confidence=(
                    self._verification_to_dict(verification)
                    if verification is not None
                    else self._capture_confidence_dict(
                        face_confidence, vehicle_confidence,
                    )
                ),
                decision_mode="session",
            )
        except SessionError as e:
            raise SessionGateError(str(e)) from e

        txn = await self._transactions.create_transaction(
            session_id=session.session_id,
            vehicle_id=plate_text,
            action="ENTRY",
            decision=decision,
            request_id=request_id,
            gate_name=gate_name,
            notes=notes,
        )
        self._log.log_entry(plate_text, session.session_id, txn.transaction_id)
        return session, txn

    async def validate_exit_session(
        self,
        plate_text: str,
        request_id: Optional[str] = None,
        gate_name: str = "Main Gate",
        notes: Optional[str] = None,
        face_embedding: Optional[list[float]] = None,
        vehicle_embedding: Optional[list[float]] = None,
        decision: str = "GRANT",
    ) -> tuple[GateSession, GateTransaction, MatchResult]:
        if decision != "GRANT":
            raise SessionGateError(
                f"Cannot validate exit session: decision is '{decision}', "
                f"only GRANT allowed"
            )

        match = await self._matcher.find_best_match(
            plate_text=plate_text,
            vehicle_embedding=vehicle_embedding,
            face_embedding=face_embedding,
        )
        if not match.matched or match.session is None:
            self._log.log_rejected(
                plate_text, match.reason or "No active session matched", "EXIT",
            )
            raise SessionGateError(
                match.reason or "No active session matched. "
                "Cannot exit without an entry session."
            )

        try:
            session = await self._sessions.close_session_by_id(
                match.session.session_id,
            )
        except SessionError as e:
            raise SessionGateError(str(e)) from e

        session.exit_confidence = match.to_dict()
        await self._sessions.attach_exit_confidence(
            session.session_id, session.exit_confidence,
        )

        txn = await self._transactions.create_transaction(
            session_id=session.session_id,
            vehicle_id=match.session.vehicle_id,
            action="EXIT",
            decision=decision,
            request_id=request_id,
            gate_name=gate_name,
            notes=notes,
        )
        self._log.log_exit(
            match.session.vehicle_id, session.session_id, txn.transaction_id,
        )
        return session, txn, match

    async def verify_capture(self, result: PipelineResult) -> SessionVerificationResult:
        return await self._verification.verify_from_pipeline(result)

    @staticmethod
    def _verification_to_dict(verification) -> Optional[dict]:
        if verification is None:
            return None
        if hasattr(verification, "to_dict"):
            return verification.to_dict()
        if isinstance(verification, dict):
            return verification
        return None

    @staticmethod
    def _capture_confidence_dict(
        face_confidence: Optional[float],
        vehicle_confidence: Optional[float],
    ) -> dict:
        return {
            "face_confidence": face_confidence,
            "vehicle_confidence": vehicle_confidence,
        }
