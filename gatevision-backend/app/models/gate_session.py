from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class GateSession(Document):
    session_id: str = Field(unique=True, index=True)
    vehicle_id: str = Field(unique=True, index=True)
    current_state: str = "OUTSIDE"
    last_entry_time: Optional[datetime] = None
    last_exit_time: Optional[datetime] = None
    active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "gate_sessions"
        use_state_management = True

    def __repr__(self) -> str:
        return (
            f"GateSession(session={self.session_id}, "
            f"vehicle={self.vehicle_id}, state={self.current_state})"
        )
