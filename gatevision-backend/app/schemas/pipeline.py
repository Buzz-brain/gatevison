from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RecognizedPlate(BaseModel):
    plate: str
    confidence: float
    validation_status: str = "unchecked"


class StageResultResponse(BaseModel):
    stage_name: str
    success: bool
    duration_ms: float
    error: Optional[str] = None


class FaceDetectionResult(BaseModel):
    bbox: list[int] = Field(default_factory=list)
    confidence: float = 0.0
    cropped_face_path: str = ""


class FaceRecognitionResult(BaseModel):
    face_detected: bool = False
    face_count: int = 0
    similarity_score: float | None = None
    matched: bool = False
    matched_driver_id: str | None = None
    matched_driver_name: str | None = None
    embedding_distance: float | None = None


class PipelineData(BaseModel):
    request_id: str
    plates_detected: int = 0
    plates_recognized: int = 0
    recognized_plates: list[RecognizedPlate] = Field(default_factory=list)
    faces_detected: int = 0
    face_recognitions: list[FaceRecognitionResult] = Field(default_factory=list)
    processing_time_ms: float = 0.0
    stage_results: list[StageResultResponse] = Field(default_factory=list)
    warnings: list = Field(default_factory=list)
    errors: list = Field(default_factory=list)


class PipelineStatusResponse(BaseModel):
    healthy: bool
    total_pipelines: int
    recent_requests: list = Field(default_factory=list)


class StageMetricsResponse(BaseModel):
    stage_name: str
    total_calls: int
    success_count: int
    failure_count: int
    avg_duration_ms: float


class PipelineMetricsResponse(BaseModel):
    total_pipelines: int
    success_count: int
    failure_count: int
    avg_total_duration_ms: float
    stages: list[StageMetricsResponse] = Field(default_factory=list)


class PipelineRequestHistory(BaseModel):
    request_id: str
    timestamp: Optional[datetime] = None
    success: bool
    total_duration_ms: float
    stage_count: int
