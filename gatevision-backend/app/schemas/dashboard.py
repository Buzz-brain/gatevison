from typing import Optional

from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_vehicles: int = 0
    total_drivers: int = 0
    vehicles_inside: int = 0
    entries_today: int = 0
    exits_today: int = 0
    grant_count: int = 0
    denial_count: int = 0
    manual_review_count: int = 0
    total_decisions: int = 0
    grant_rate: float = 0.0
    denial_rate: float = 0.0
    manual_review_rate: float = 0.0
    avg_processing_time_ms: float = 0.0
    pending_reviews: int = 0


class DashboardResponse(BaseModel):
    metrics: DashboardMetrics
    most_active_vehicles: list[dict] = []
    most_active_drivers: list[dict] = []
    peak_entry_hours: list[dict] = []
    daily_trend: list[dict] = []
