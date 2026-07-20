from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from beanie import Document
from pydantic import Field


class BackupType(str, Enum):
    DATABASE = "database"
    CONFIGURATION = "configuration"
    FULL = "full"


class BackupStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class SystemBackup(Document):
    backup_type: BackupType
    status: BackupStatus = BackupStatus.PENDING
    filename: str
    filepath: str
    size_bytes: Optional[int] = None
    collections: list[str] = Field(default_factory=list)
    record_count: int = 0
    error_message: Optional[str] = None
    checksum: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None

    class Settings:
        name = "system_backups"
        use_revision = True
