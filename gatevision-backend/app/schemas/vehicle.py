from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class VehicleFingerprintResponse(BaseModel):
    id: str = Field(alias="_id")
    plate_text: str
    dimension: int
    created_at: datetime
    updated_at: datetime


class VehicleFingerprintCreate(BaseModel):
    plate_text: str
    embedding: list[float]


class VehicleFingerprintUpdate(BaseModel):
    embedding: list[float]


class FingerprintExtractResult(BaseModel):
    embedding: list[float]
    dimension: int
    duration_ms: float
    plate_text: Optional[str] = None


class VerifyResult(BaseModel):
    match: bool
    score: float
    threshold: Optional[float] = None
    message: str


class LookupResult(BaseModel):
    id: str
    score: float
    metric: str
    plate_text: Optional[str] = None
    embedding: Optional[list[float]] = None


class VehicleHealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_name: str
    device: str


class VehicleModelInfo(BaseModel):
    loaded: bool
    model_name: str
    device: str
    embedding_dim: int
    similarity_threshold: Optional[float] = None
