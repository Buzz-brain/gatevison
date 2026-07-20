import logging
from typing import Optional

from app.models.system_event import SystemEvent
from app.repositories.system_event_repository import SystemEventRepository

logger = logging.getLogger(__name__)


class EventLogger:
    def __init__(self):
        self._repo = SystemEventRepository()

    async def log_event(
        self,
        event_type: str,
        description: str,
        severity: str = "info",
        source: str = "system",
        metadata: Optional[dict] = None,
    ) -> SystemEvent:
        import uuid
        event = SystemEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            severity=severity,
            source=source,
            description=description,
            metadata=metadata or {},
        )
        result = await self._repo.create(event)
        logger.info(
            "Event | type=%s severity=%s source=%s | %s",
            event_type, severity, source, description,
        )
        return result

    async def log_user_login(self, user_id: str) -> SystemEvent:
        return await self.log_event(
            event_type="user_login",
            severity="info",
            source="auth",
            description=f"User '{user_id}' logged in",
            metadata={"user_id": user_id},
        )

    async def log_model_load(self, model_name: str, status: str) -> SystemEvent:
        return await self.log_event(
            event_type="model_load",
            severity="info",
            source="ai",
            description=f"Model '{model_name}' loaded: {status}",
            metadata={"model_name": model_name, "status": status},
        )

    async def log_decision_override(
        self, request_id: str, old_decision: str, new_decision: str,
    ) -> SystemEvent:
        return await self.log_event(
            event_type="decision_override",
            severity="warning",
            source="admin",
            description=(
                f"Decision override for request '{request_id}': "
                f"{old_decision} -> {new_decision}"
            ),
            metadata={
                "request_id": request_id,
                "old_decision": old_decision,
                "new_decision": new_decision,
            },
        )

    async def log_review_action(
        self, review_id: str, action: str, reviewer_id: str,
    ) -> SystemEvent:
        return await self.log_event(
            event_type="manual_review_action",
            severity="info",
            source="admin",
            description=f"Manual review '{review_id}' {action} by '{reviewer_id}'",
            metadata={
                "review_id": review_id,
                "action": action,
                "reviewer_id": reviewer_id,
            },
        )

    async def log_config_change(self, key: str, old_value, new_value) -> SystemEvent:
        return await self.log_event(
            event_type="config_change",
            severity="warning",
            source="system",
            description=f"Config '{key}' changed",
            metadata={
                "key": key,
                "old_value": str(old_value),
                "new_value": str(new_value),
            },
        )

    async def log_system_startup(self) -> SystemEvent:
        return await self.log_event(
            event_type="system_startup",
            severity="info",
            source="system",
            description="System started",
        )

    async def log_system_shutdown(self) -> SystemEvent:
        return await self.log_event(
            event_type="system_shutdown",
            severity="info",
            source="system",
            description="System shutdown",
        )

    async def log_critical_error(
        self, error: str, source: str = "system",
    ) -> SystemEvent:
        return await self.log_event(
            event_type="critical_error",
            severity="critical",
            source=source,
            description=f"Critical error: {error}",
            metadata={"error": error},
        )
