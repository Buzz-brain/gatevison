from typing import Optional

from app.models.system_event import SystemEvent


class SystemEventRepository:
    @staticmethod
    async def create(event: SystemEvent) -> SystemEvent:
        return await event.insert()

    @staticmethod
    async def get_all(
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
        source: Optional[str] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[SystemEvent]:
        query = {}
        if event_type:
            query["event_type"] = event_type
        if severity:
            query["severity"] = severity
        if source:
            query["source"] = source
        return (
            await SystemEvent.find(query)
            .sort(-SystemEvent.created_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def count(
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
    ) -> int:
        query = {}
        if event_type:
            query["event_type"] = event_type
        if severity:
            query["severity"] = severity
        return await SystemEvent.find(query).count()
