from datetime import datetime, timezone
from enum import Enum
from beanie import Document
from pydantic import Field


class ImageCategory(str, Enum):
    ENTRY = "entry"
    EXIT = "exit"
    FACE = "face"
    VEHICLE = "vehicle"
    PLATE = "plate"
    TEMP = "temp"


class Image(Document):
    filename: str
    filepath: str
    category: ImageCategory
    mime_type: str = "image/jpeg"
    width: int
    height: int
    filesize: int
    camera_id: str = "default"
    captured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "images"
        use_revision = True

    def __repr__(self) -> str:
        return f"<Image {self.filename}>"
