from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ReportRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    report_type: str = "daily"
    action: Optional[str] = None
    decision: Optional[str] = None
    vehicle_id: Optional[str] = None
    driver_id: Optional[str] = None
    skip: int = 0
    limit: int = 100


class ReportResponse(BaseModel):
    report_type: str
    total: int
    results: list[dict]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
