from datetime import datetime, timezone
from typing import Optional
from beanie import Document
from pydantic import Field


class OcrResult(Document):
    plate_detection_id: Optional[str] = None
    raw_text: str = ""
    cleaned_text: str = ""
    confidence: float = 0.0
    processing_time: float = 0.0
    validation_status: str = "unchecked"
    validation_message: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "ocr_results"
        use_revision = True

    def __repr__(self) -> str:
        return f"<OcrResult text='{self.cleaned_text}' conf={self.confidence:.3f}>"
