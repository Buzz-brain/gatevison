from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class ManualReview(Document):
    review_id: str = Field(unique=True, index=True)
    request_id: str = Field(index=True)
    vehicle_id: str = Field(index=True)
    driver_id: Optional[str] = None
    decision: str = "MANUAL_REVIEW"
    status: str = "pending"
    reviewer_id: Optional[str] = None
    reviewer_notes: Optional[str] = None
    outcome: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "manual_reviews"
        use_state_management = True

    def __repr__(self) -> str:
        return (
            f"ManualReview(review={self.review_id}, "
            f"vehicle={self.vehicle_id}, status={self.status})"
        )
