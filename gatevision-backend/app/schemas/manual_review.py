from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ManualReviewRequest(BaseModel):
    request_id: str
    vehicle_id: str
    driver_id: Optional[str] = None
    notes: Optional[str] = None


class ManualReviewApprove(BaseModel):
    reviewer_id: str
    notes: Optional[str] = None


class ManualReviewReject(BaseModel):
    reviewer_id: str
    notes: Optional[str] = None


class ManualReviewResponse(BaseModel):
    id: str = Field(alias="_id")
    review_id: str
    request_id: str
    vehicle_id: str
    driver_id: Optional[str] = None
    decision: str
    status: str
    reviewer_id: Optional[str] = None
    reviewer_notes: Optional[str] = None
    outcome: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
