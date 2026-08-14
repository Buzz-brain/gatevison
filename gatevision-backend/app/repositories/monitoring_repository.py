from datetime import datetime, timezone
from typing import Any, Optional

from app.repositories.base import BaseRepository
from app.models.system_health import SystemHealth, SystemHealthStatus
from app.schemas.system import SystemHealthCreate


class MonitoringRepository(BaseRepository[SystemHealth, SystemHealthCreate, Any]):
    def __init__(self):
        super().__init__(SystemHealth)

    async def record_health(
        self, status: SystemHealthStatus, **details: Any
    ) -> SystemHealth:
        record = SystemHealth(
            status=status,
            app_healthy=details.get("app_healthy", True),
            mongodb_healthy=details.get("mongodb_healthy", True),
            camera_healthy=details.get("camera_healthy", True),
            pipeline_healthy=details.get("pipeline_healthy", True),
            storage_healthy=details.get("storage_healthy", True),
            model_registry_healthy=details.get("model_registry_healthy", True),
            details=details.get("details", {}),
        )
        return await record.insert()

    async def get_latest_health(self) -> Optional[SystemHealth]:
        return (
            await self.model.find()
            .sort(-self.model.checked_at)
            .limit(1)
            .to_list()
        )[0] if await self.model.find().count() > 0 else None

    async def get_health_history(
        self, limit: int = 50, skip: int = 0
    ) -> list[SystemHealth]:
        return (
            await self.model.find()
            .sort(-self.model.checked_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    async def get_unhealthy_periods(
        self, since: Optional[datetime] = None
    ) -> list[SystemHealth]:
        query = {"status": {"$ne": SystemHealthStatus.HEALTHY}}
        if since:
            query["checked_at"] = {"$gte": since}
        return await self.model.find(query).sort(-self.model.checked_at).to_list()

    async def get_db_stats(self) -> dict:
        db = self.model.get_pymongo_collection().database
        stats = await db.command("dbStats")
        collections_list = await db.list_collection_names()
        collection_counts = {}
        for name in sorted(collections_list):
            count = await db[name].count_documents({})
            collection_counts[name] = count
        return {
            "database": str(db.name),
            "collections": len(collections_list),
            "collection_counts": collection_counts,
            "data_size_bytes": stats.get("dataSize", 0),
            "storage_size_bytes": stats.get("storageSize", 0),
            "index_size_bytes": stats.get("indexSize", 0),
            "total_size_bytes": stats.get("totalSize", 0),
        }
