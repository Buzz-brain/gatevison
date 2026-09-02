from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class PendingVehicle(Document):
    """A vehicle the system-camera has scanned but whose driver has not yet
    presented a face for identity verification.

    This is the glue of the two-camera fusion flow: the system webcam captures
    the vehicle (plate + vehicle fingerprint) and stores it here while the
    operator (e.g. a phone at the booth via Live Gate) later supplies the face.
    The record is single-use: completing the identity check consumes it.
    """

    source: str = "camera"
    frame: bytes = Field(default_factory=bytes)
    plate_text: str = ""
    direction: str = "entry"
    vehicles_detected: int = 0
    processing_time_ms: float = 0.0
    expires_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "pending_vehicles"
        use_state_management = True

    def __repr__(self) -> str:
        return (
            f"PendingVehicle(plate={self.plate_text!r}, "
            f"direction={self.direction}, source={self.source})"
        )