from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class VehicleProfile(Document):
    vehicle_id: str = Field(unique=True, index=True)
    plate_number: str = Field(unique=True, index=True)
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    year: Optional[int] = None
    owner_id: Optional[str] = None
    linked_driver_ids: list[str] = Field(default_factory=list)
    vehicle_embedding_reference: Optional[list[float]] = None
    registration_status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "vehicle_profiles"
        use_state_management = True

    def __repr__(self) -> str:
        return f"VehicleProfile(plate={self.plate_number}, vehicle_id={self.vehicle_id})"
