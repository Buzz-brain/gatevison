from datetime import datetime, timezone
from typing import Optional

from beanie import Document
from pydantic import Field


class FaceRecord(Document):
    image_id: str = ""
    embedding: list[float] = Field(default_factory=list)
    embedding_dimension: int = 512
    detection_confidence: float = 0.0
    similarity_score: Optional[float] = None
    matched: bool = False
    cropped_face_path: str = ""
    inference_time: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "face_records"
        indexes = ["created_at", "matched"]
