import logging
from datetime import datetime
from typing import Optional

from app.models.gate_session import GateSession
from app.repositories.gate_session_repository import GateSessionRepository

logger = logging.getLogger(__name__)


class SessionError(Exception):
    pass


class SessionService:
    def __init__(self):
        self._repo = GateSessionRepository()

    async def get_or_create_session(
        self, vehicle_id: str,
    ) -> GateSession:
        session = await self._repo.get_active_by_vehicle_id(vehicle_id)
        if session:
            return session
        import uuid
        session = GateSession(
            session_id=str(uuid.uuid4()),
            vehicle_id=vehicle_id,
            current_state="OUTSIDE",
        )
        return await self._repo.create(session)

    async def get_session(self, vehicle_id: str) -> Optional[GateSession]:
        return await self._repo.get_active_by_vehicle_id(vehicle_id)

    async def transition_to_inside(
        self, vehicle_id: str,
    ) -> GateSession:
        session = await self._repo.get_active_by_vehicle_id(vehicle_id)
        if not session:
            raise SessionError(f"No active session for vehicle '{vehicle_id}'")
        if session.current_state != "OUTSIDE":
            raise SessionError(
                f"Vehicle '{vehicle_id}' is already INSIDE"
            )
        session.current_state = "INSIDE"
        session.last_entry_time = datetime.utcnow()
        return await self._repo.update(session)

    async def transition_to_outside(
        self, vehicle_id: str,
    ) -> GateSession:
        session = await self._repo.get_active_by_vehicle_id(vehicle_id)
        if not session:
            raise SessionError(f"No active session for vehicle '{vehicle_id}'")
        if session.current_state != "INSIDE":
            raise SessionError(
                f"Vehicle '{vehicle_id}' is already OUTSIDE"
            )
        session.current_state = "OUTSIDE"
        session.last_exit_time = datetime.utcnow()
        return await self._repo.update(session)

    async def open_session(
        self,
        vehicle_id: str,
        plate_text: Optional[str] = None,
        vehicle_embedding: Optional[list[float]] = None,
        face_embedding: Optional[list[float]] = None,
        confidence: Optional[dict] = None,
        decision_mode: Optional[str] = None,
    ) -> GateSession:
        """Create (or reuse) a session and transition it to INSIDE, attaching
        the capture signals recorded at entry for later exit matching.
        """
        session = await self._repo.get_active_by_vehicle_id(vehicle_id)
        if session and session.current_state == "INSIDE":
            raise SessionError(
                f"Vehicle '{vehicle_id}' is already INSIDE. "
                f"Duplicate entry rejected."
            )
        if session is None:
            import uuid
            session = GateSession(
                session_id=str(uuid.uuid4()),
                vehicle_id=vehicle_id,
                current_state="OUTSIDE",
            )
            await self._repo.create(session)

        session.plate_text = plate_text or vehicle_id
        if vehicle_embedding is not None:
            session.vehicle_embedding = vehicle_embedding
        if face_embedding is not None:
            session.face_embedding = face_embedding
        if confidence is not None:
            session.entry_confidence = confidence
        if decision_mode is not None:
            session.decision_mode = decision_mode
        session.current_state = "INSIDE"
        session.last_entry_time = datetime.utcnow()
        return await self._repo.update(session)

    async def force_close(self, vehicle_id: str) -> GateSession:
        session = await self._repo.get_active_by_vehicle_id(vehicle_id)
        if not session:
            raise SessionError(f"No active session for vehicle '{vehicle_id}'")
        if session.current_state != "INSIDE":
            raise SessionError(
                f"Vehicle '{vehicle_id}' is not INSIDE "
                f"(current state: {session.current_state})"
            )
        session.current_state = "OUTSIDE"
        session.last_exit_time = datetime.utcnow()
        return await self._repo.update(session)

    async def close_session_by_id(self, session_id: str) -> GateSession:
        session = await self._repo.get_by_session_id(session_id)
        if not session:
            raise SessionError(f"No active session '{session_id}'")
        if session.current_state != "INSIDE":
            raise SessionError(
                f"Session '{session_id}' is not INSIDE "
                f"(current state: {session.current_state})"
            )
        session.current_state = "OUTSIDE"
        session.last_exit_time = datetime.utcnow()
        return await self._repo.update(session)

    async def attach_exit_confidence(
        self, session_id: str, confidence: Optional[dict],
    ) -> Optional[GateSession]:
        if confidence is None:
            return None
        session = await self._repo.get_by_session_id(session_id)
        if session is None:
            return None
        session.exit_confidence = confidence
        return await self._repo.update(session)

    async def get_vehicles_inside(self) -> list[GateSession]:
        return await self._repo.get_vehicles_inside()

    async def get_vehicles_outside(self) -> list[GateSession]:
        return await self._repo.get_vehicles_outside()

    async def get_all_active(self) -> list[GateSession]:
        return await self._repo.get_all_active()

    async def get_all_sessions(
        self, skip: int = 0, limit: int = 100,
    ) -> list[GateSession]:
        return await self._repo.get_all(skip=skip, limit=limit)

    async def get_statistics(self) -> dict:
        return {
            "vehicles_inside": await self._repo.count_inside(),
            "vehicles_outside": await self._repo.count_outside(),
            "total_sessions": await self._repo.count(),
        }
