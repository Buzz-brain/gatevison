from datetime import datetime, timezone
from typing import Optional
from beanie import Document
from pydantic import Field


class PlateDetection(Document):
    image_id: Optional[str] = None
    confidence: float
    bbox: list[int]
    cropped_plate_path: str
    inference_time_ms: float
    model_version: str = "unknown"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "plate_detections"
        use_revision = True

    def __repr__(self) -> str:
        return f"<PlateDetection conf={self.confidence:.3f}>"
