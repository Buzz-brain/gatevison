from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class VehicleFingerprint(Document):
    plate_text: str = Field(unique=True, index=True)
    embedding: list[float]
    dimension: int = 2048
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "vehicle_fingerprints"
        use_state_management = True

    def __repr__(self) -> str:
        return f"VehicleFingerprint(plate={self.plate_text}, dim={self.dimension})"
