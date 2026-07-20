from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.image import ImageCategory


class ImageCreate(BaseModel):
    filename: str
    filepath: str
    category: ImageCategory
    mime_type: str = "image/jpeg"
    width: int
    height: int
    filesize: int
    camera_id: str = "default"
    captured_at: Optional[datetime] = None


class ImageUpdate(BaseModel):
    category: Optional[ImageCategory] = None


class ImageResponse(BaseModel):
    id: str
    filename: str
    filepath: str
    category: ImageCategory
    mime_type: str
    width: int
    height: int
    filesize: int
    camera_id: str
    captured_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CaptureResponse(BaseModel):
    image_id: str
    filename: str
    filepath: str
    width: int
    height: int
    filesize: int
    category: str
    captured_at: datetime
