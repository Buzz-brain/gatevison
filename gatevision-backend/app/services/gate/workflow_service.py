import logging
from dataclasses import dataclass, field
from typing import Optional

from app.services.gate.audit_service import AuditService
from app.services.gate.entry_service import EntryService, EntryError
from app.services.gate.exit_service import ExitService, ExitError
from app.services.gate.gate_logger import GateLogger
from app.services.gate.session_gate_service import (
    SessionGateError,
    SessionGateService,
)
from app.services.gate.session_verification_service import (
    SessionVerificationResult,
)

logger = logging.getLogger(__name__)


@dataclass
class WorkflowResult:
    success: bool
    action: str
    vehicle_id: str
    session: Optional[dict] = None
    transaction: Optional[dict] = None
    message: str = ""
    error: Optional[str] = None


class WorkflowService:
    def __init__(self):
        self._entry = EntryService()
        self._exit = ExitService()
        self._audit = AuditService()
        self._log = GateLogger()
        self._session_gate = SessionGateService()

    async def run_session_entry(
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
    ) -> WorkflowResult:
        try:
            session, txn = await self._session_gate.create_entry_session(
                plate_text=plate_text,
                request_id=request_id,
                gate_name=gate_name,
                notes=notes,
                face_embedding=face_embedding,
                vehicle_embedding=vehicle_embedding,
                face_confidence=face_confidence,
                vehicle_confidence=vehicle_confidence,
                decision=decision,
                verification=verification,
            )
            return WorkflowResult(
                success=True,
                action="ENTRY",
                vehicle_id=plate_text,
                session=self._session_dict(session, "last_entry_time"),
                transaction=self._transaction_dict(txn),
                message=f"Entry session created for '{plate_text}'",
            )
        except SessionGateError as e:
            self._log.log_error("entry_session", str(e))
            return WorkflowResult(
                success=False,
                action="ENTRY",
                vehicle_id=plate_text,
                error=str(e),
                message="Entry rejected",
            )

    async def run_session_exit(
        self,
        plate_text: str,
        request_id: Optional[str] = None,
        gate_name: str = "Main Gate",
        notes: Optional[str] = None,
        face_embedding: Optional[list[float]] = None,
        vehicle_embedding: Optional[list[float]] = None,
        decision: str = "GRANT",
    ) -> WorkflowResult:
        try:
            session, txn, match = await self._session_gate.validate_exit_session(
                plate_text=plate_text,
                request_id=request_id,
                gate_name=gate_name,
                notes=notes,
                face_embedding=face_embedding,
                vehicle_embedding=vehicle_embedding,
                decision=decision,
            )
            result = WorkflowResult(
                success=True,
                action="EXIT",
                vehicle_id=session.vehicle_id,
                session=self._session_dict(session, "last_exit_time"),
                transaction=self._transaction_dict(txn),
                message=(
                    f"Exit session validated for '{session.vehicle_id}' "
                    f"(match score {match.score:.2f})"
                ),
            )
            result.session["match"] = match.to_dict()
            return result
        except SessionGateError as e:
            self._log.log_error("exit_session", str(e))
            return WorkflowResult(
                success=False,
                action="EXIT",
                vehicle_id=plate_text,
                error=str(e),
                message="Exit rejected",
            )

    @staticmethod
    def _session_dict(session, time_attr: str) -> dict:
        return {
            "session_id": session.session_id,
            "vehicle_id": session.vehicle_id,
            "current_state": session.current_state,
            time_attr: (
                getattr(session, time_attr).isoformat()
                if getattr(session, time_attr) else None
            ),
        }

    @staticmethod
    def _transaction_dict(txn) -> dict:
        return {
            "transaction_id": txn.transaction_id,
            "action": txn.action,
            "decision": txn.decision,
            "timestamp": txn.timestamp.isoformat(),
        }

    async def run_entry_workflow(
        self,
        vehicle_id: str,
        decision: str,
        request_id: Optional[str] = None,
        driver_id: Optional[str] = None,
        gate_name: str = "Main Gate",
        notes: Optional[str] = None,
    ) -> WorkflowResult:
        try:
            session, txn = await self._entry.process_entry(
                vehicle_id=vehicle_id,
                decision=decision,
                request_id=request_id,
                driver_id=driver_id,
                gate_name=gate_name,
                notes=notes,
            )
            return WorkflowResult(
                success=True,
                action="ENTRY",
                vehicle_id=vehicle_id,
                session={
                    "session_id": session.session_id,
                    "vehicle_id": session.vehicle_id,
                    "current_state": session.current_state,
                    "last_entry_time": (
                        session.last_entry_time.isoformat()
                        if session.last_entry_time else None
                    ),
                },
                transaction={
                    "transaction_id": txn.transaction_id,
                    "action": txn.action,
                    "decision": txn.decision,
                    "timestamp": txn.timestamp.isoformat(),
                },
                message=f"Vehicle '{vehicle_id}' entry processed successfully",
            )
        except EntryError as e:
            self._log.log_error("entry_workflow", str(e))
            return WorkflowResult(
                success=False,
                action="ENTRY",
                vehicle_id=vehicle_id,
                error=str(e),
                message="Entry rejected",
            )

    async def run_exit_workflow(
        self,
        vehicle_id: str,
        decision: str,
        request_id: Optional[str] = None,
        driver_id: Optional[str] = None,
        gate_name: str = "Main Gate",
        notes: Optional[str] = None,
    ) -> WorkflowResult:
        try:
            session, txn = await self._exit.process_exit(
                vehicle_id=vehicle_id,
                decision=decision,
                request_id=request_id,
                driver_id=driver_id,
                gate_name=gate_name,
                notes=notes,
            )
            return WorkflowResult(
                success=True,
                action="EXIT",
                vehicle_id=vehicle_id,
                session={
                    "session_id": session.session_id,
                    "vehicle_id": session.vehicle_id,
                    "current_state": session.current_state,
                    "last_exit_time": (
                        session.last_exit_time.isoformat()
                        if session.last_exit_time else None
                    ),
                },
                transaction={
                    "transaction_id": txn.transaction_id,
                    "action": txn.action,
                    "decision": txn.decision,
                    "timestamp": txn.timestamp.isoformat(),
                },
                message=f"Vehicle '{vehicle_id}' exit processed successfully",
            )
        except ExitError as e:
            self._log.log_error("exit_workflow", str(e))
            return WorkflowResult(
                success=False,
                action="EXIT",
                vehicle_id=vehicle_id,
                error=str(e),
                message="Exit rejected",
            )
