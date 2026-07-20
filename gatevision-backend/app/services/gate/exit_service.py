import logging
from typing import Optional

from app.models.gate_session import GateSession
from app.models.gate_transaction import GateTransaction
from app.services.gate.gate_logger import GateLogger
from app.services.gate.session_service import SessionService, SessionError
from app.services.gate.transaction_service import TransactionService

logger = logging.getLogger(__name__)


class ExitError(Exception):
    pass


class ExitService:
    def __init__(self):
        self._sessions = SessionService()
        self._transactions = TransactionService()
        self._log = GateLogger()

    async def process_exit(
        self,
        vehicle_id: str,
        decision: str,
        request_id: Optional[str] = None,
        driver_id: Optional[str] = None,
        gate_name: str = "Main Gate",
        notes: Optional[str] = None,
    ) -> tuple[GateSession, GateTransaction]:
        if decision != "GRANT":
            self._log.log_rejected(
                vehicle_id,
                f"Decision is '{decision}', not GRANT",
                "EXIT",
            )
            raise ExitError(
                f"Cannot process exit: decision is '{decision}', "
                f"only GRANT allowed"
            )

        session = await self._sessions.get_session(vehicle_id)
        if not session:
            self._log.log_rejected(
                vehicle_id, "No active session found", "EXIT",
            )
            raise ExitError(
                f"No active session for vehicle '{vehicle_id}'. "
                f"Cannot exit without having entered."
            )

        if session.current_state != "INSIDE":
            self._log.log_rejected(
                vehicle_id,
                f"State is '{session.current_state}', not INSIDE",
                "EXIT",
            )
            raise ExitError(
                f"Vehicle '{vehicle_id}' is not INSIDE "
                f"(current state: {session.current_state}). "
                f"Invalid exit rejected."
            )

        try:
            session = await self._sessions.transition_to_outside(vehicle_id)
        except SessionError as e:
            raise ExitError(str(e)) from e

        txn = await self._transactions.create_transaction(
            session_id=session.session_id,
            vehicle_id=vehicle_id,
            action="EXIT",
            decision=decision,
            request_id=request_id,
            driver_id=driver_id,
            gate_name=gate_name,
            notes=notes,
        )

        self._log.log_exit(vehicle_id, session.session_id, txn.transaction_id)
        return session, txn
