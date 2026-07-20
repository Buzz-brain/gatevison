from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class AccessPolicy(Document):
    policy_id: str = Field(unique=True, index=True)
    target_type: str = "vehicle"
    target_id: str = Field(index=True)
    allowed_days: list[str] = Field(default_factory=lambda: ["mon","tue","wed","thu","fri","sat","sun"])
    allowed_time_ranges: list[dict] = Field(default_factory=lambda: [{"start": "00:00", "end": "23:59"}])
    expiration_date: Optional[datetime] = None
    maximum_entries_per_day: Optional[int] = None
    blacklist: bool = False
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "access_policies"
        use_state_management = True

    def __repr__(self) -> str:
        return f"AccessPolicy(policy_id={self.policy_id}, target={self.target_type}:{self.target_id})"
