from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FaceDetectionResult(BaseModel):
    bbox: list[int] = Field(default_factory=list)
    confidence: float = 0.0
    cropped_face_path: str = ""


class FaceRecognitionResult(BaseModel):
    face_detected: bool = False
    face_count: int = 0
    detections: list[FaceDetectionResult] = Field(default_factory=list)
    similarity_score: Optional[float] = None
    matched: bool = False
    embedding_dimension: int = 0
    inference_time_ms: float = 0.0


class FaceRecognizeResponse(BaseModel):
    face_detected: bool
    face_count: int
    similarity_score: Optional[float] = None
    matched: bool = False
    inference_time_ms: float = 0.0
    record_id: Optional[str] = None


class FaceCompareResponse(BaseModel):
    similarity_score: float
    is_match: bool
    threshold: float
    distance_metric: str


class FaceHistoryResponse(BaseModel):
    id: str
    detection_confidence: float
    similarity_score: Optional[float] = None
    matched: bool
    inference_time: float
    created_at: datetime


class FaceModelInfoResponse(BaseModel):
    loaded: bool
    model_name: str
    device: str
    version: str
