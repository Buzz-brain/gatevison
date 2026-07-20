from datetime import datetime, timedelta, timezone
from typing import Optional

from app.models.system_event import SystemEvent


class MonitoringService:
    async def get_log_statistics(
        self, hours: int = 24
    ) -> dict:
        now = datetime.now(timezone.utc)
        since = now - timedelta(hours=hours)

        try:
            total = await SystemEvent.find_all().count()
        except Exception:
            total = 0

        try:
            recent = await SystemEvent.find(
                SystemEvent.created_at >= since
            ).count()
        except Exception:
            recent = 0

        event_types: dict[str, int] = {}
        severity_counts: dict[str, int] = {}
        errors_last_24h = 0

        try:
            async for event in SystemEvent.find_all():
                event_types[event.event_type] = event_types.get(event.event_type, 0) + 1
                severity_counts[event.severity] = severity_counts.get(event.severity, 0) + 1
                if (event.severity in ("error", "critical")
                        and event.created_at >= since):
                    errors_last_24h += 1
        except Exception:
            pass

        return {
            "total_events": total,
            "event_types": event_types,
            "severity_counts": severity_counts,
            "recent_events": recent,
            "errors_last_24h": errors_last_24h,
        }


monitoring_service = MonitoringService()
