from datetime import datetime, timezone
from enum import Enum
from beanie import Document
from pydantic import Field


class SystemHealthStatus(str, Enum):
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class SystemHealth(Document):
    status: SystemHealthStatus = SystemHealthStatus.HEALTHY
    app_healthy: bool = True
    mongodb_healthy: bool = True
    camera_healthy: bool = True
    pipeline_healthy: bool = True
    storage_healthy: bool = True
    model_registry_healthy: bool = True
    details: dict = Field(default_factory=dict)
    checked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "system_health"
        use_revision = True
