from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class OcrReadResponse(BaseModel):
    raw_text: str
    cleaned_text: str
    confidence: float
    processing_time: float
    validation_status: str
    validation_message: str


class OcrResultResponse(BaseModel):
    id: str
    plate_detection_id: Optional[str] = None
    raw_text: str
    cleaned_text: str
    confidence: float
    processing_time: float
    validation_status: str
    validation_message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OcrHistoryResponse(BaseModel):
    results: list[OcrResultResponse]
    total: int
    skip: int
    limit: int


class OcrSearchResponse(BaseModel):
    results: list[OcrResultResponse]
    total: int
    query: str


class OcrModelInfoResponse(BaseModel):
    loaded: bool
    languages: list[str] = ["en"]
    device: Optional[str] = None
    model_version: Optional[str] = None
