from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field


class SystemHealthCreate(BaseModel):
    pass


class ModelInfoResponse(BaseModel):
    name: str
    model_type: str
    version: str = "unknown"
    device: str = "cpu"
    loaded: bool = False
    model_path: Optional[str] = None
    memory_mb: Optional[float] = None
    error: Optional[str] = None


class ModelDetailResponse(ModelInfoResponse):
    total_inference_count: int = 0
    avg_inference_time_ms: float = 0.0
    last_inference_timestamp: Optional[datetime] = None
    error_count: int = 0


class ComponentHealth(BaseModel):
    healthy: bool
    status: str = "unknown"
    message: str = ""


class SystemHealthResponse(BaseModel):
    overall_status: str
    components: dict[str, ComponentHealth]
    checked_at: datetime


class PerformanceMetricsResponse(BaseModel):
    avg_pipeline_execution_time_ms: float = 0.0
    total_processed_requests: int = 0
    failed_requests: int = 0
    pipeline_success_rate: float = 0.0
    avg_stage_times_ms: dict[str, float] = Field(default_factory=dict)


class StorageInfoResponse(BaseModel):
    upload_directory_size_bytes: int = 0
    total_images: int = 0
    images_by_category: dict[str, int] = Field(default_factory=dict)
    total_cropped_plates: int = 0
    total_cropped_faces: int = 0
    total_vehicle_images: int = 0
    orphaned_files: int = 0
    available_disk_space_bytes: int = 0


class CleanupResultResponse(BaseModel):
    deleted_files: int = 0
    deleted_temp_files: int = 0
    deleted_empty_dirs: int = 0
    freed_bytes: int = 0


class ConfigurationResponse(BaseModel):
    settings: dict[str, Any]
    warnings: list[str] = Field(default_factory=list)


class VersionResponse(BaseModel):
    system_name: str
    version: str
    build_timestamp: Optional[str] = None
    python_version: str
    fastapi_version: str
    mongodb_version: Optional[str] = None
    ai_libraries: dict[str, str] = Field(default_factory=dict)


class BackupExportRequest(BaseModel):
    backup_type: str = "database"
    collections: Optional[list[str]] = None


class BackupImportRequest(BaseModel):
    filename: str


class BackupResponse(BaseModel):
    success: bool
    message: str
    filename: Optional[str] = None
    collections: list[str] = Field(default_factory=list)
    record_count: int = 0
    size_bytes: Optional[int] = None


class BackupImportResponse(BaseModel):
    success: bool
    message: str
    collections_imported: list[str] = Field(default_factory=list)
    total_records: int = 0
    errors: list[str] = Field(default_factory=list)


class LogStatisticsResponse(BaseModel):
    total_events: int = 0
    event_types: dict[str, int] = Field(default_factory=dict)
    severity_counts: dict[str, int] = Field(default_factory=dict)
    recent_events: int = 0
    errors_last_24h: int = 0
