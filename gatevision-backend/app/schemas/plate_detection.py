from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class DetectionResult(BaseModel):
    confidence: float = Field(..., ge=0.0, le=1.0)
    bbox: list[int]
    cropped_plate_path: str
    inference_time_ms: float


class PlateDetectResponse(BaseModel):
    detections: list[DetectionResult]
    total_plates: int
    inference_time_ms: float
    model_version: str


class PlateDetectionResponse(BaseModel):
    id: str
    image_id: Optional[str] = None
    confidence: float
    bbox: list[int]
    cropped_plate_path: str
    inference_time_ms: float
    model_version: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ModelInfoResponse(BaseModel):
    loaded: bool
    model_path: Optional[str] = None
    device: Optional[str] = None
    model_version: Optional[str] = None


class DetectionHistoryResponse(BaseModel):
    detections: list[PlateDetectionResponse]
    total: int
    skip: int
    limit: int
