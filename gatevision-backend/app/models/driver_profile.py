from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class DriverProfile(Document):
    driver_id: str = Field(unique=True, index=True)
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    face_embedding_reference: Optional[list[float]] = None
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "driver_profiles"
        use_state_management = True

    def __repr__(self) -> str:
        return f"DriverProfile(driver_id={self.driver_id}, name={self.full_name})"
