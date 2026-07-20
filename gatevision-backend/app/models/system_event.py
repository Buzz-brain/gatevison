from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class SystemEvent(Document):
    event_id: str = Field(unique=True, index=True)
    event_type: str = Field(index=True)
    severity: str = "info"
    source: str = Field(index=True)
    description: str
    metadata: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "system_events"
        use_state_management = True

    def __repr__(self) -> str:
        return (
            f"SystemEvent(event={self.event_id}, "
            f"type={self.event_type}, severity={self.severity})"
        )
