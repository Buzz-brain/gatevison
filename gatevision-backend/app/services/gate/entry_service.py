import logging
from typing import Optional

from app.models.gate_session import GateSession
from app.models.gate_transaction import GateTransaction
from app.services.gate.gate_logger import GateLogger
from app.services.gate.session_service import SessionService, SessionError
from app.services.gate.transaction_service import TransactionService

logger = logging.getLogger(__name__)


class EntryError(Exception):
    pass


class EntryService:
    def __init__(self):
        self._sessions = SessionService()
        self._transactions = TransactionService()
        self._log = GateLogger()

    async def process_entry(
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
                "ENTRY",
            )
            raise EntryError(
                f"Cannot process entry: decision is '{decision}', "
                f"only GRANT allowed"
            )

        try:
            session = await self._sessions.get_or_create_session(vehicle_id)
        except SessionError as e:
            raise EntryError(str(e)) from e

        if session.current_state == "INSIDE":
            self._log.log_rejected(vehicle_id, "Already INSIDE", "ENTRY")
            raise EntryError(
                f"Vehicle '{vehicle_id}' is already INSIDE. "
                f"Duplicate entry rejected."
            )

        try:
            session = await self._sessions.transition_to_inside(vehicle_id)
        except SessionError as e:
            raise EntryError(str(e)) from e

        txn = await self._transactions.create_transaction(
            session_id=session.session_id,
            vehicle_id=vehicle_id,
            action="ENTRY",
            decision=decision,
            request_id=request_id,
            driver_id=driver_id,
            gate_name=gate_name,
            notes=notes,
        )

        self._log.log_entry(vehicle_id, session.session_id, txn.transaction_id)
        return session, txn
