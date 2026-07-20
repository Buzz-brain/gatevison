from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AccessPolicyCreate(BaseModel):
    policy_id: str
    target_type: str = "vehicle"
    target_id: str
    allowed_days: list[str] = Field(
        default_factory=lambda: ["mon","tue","wed","thu","fri","sat","sun"]
    )
    allowed_time_ranges: list[dict] = Field(
        default_factory=lambda: [{"start": "00:00", "end": "23:59"}]
    )
    expiration_date: Optional[datetime] = None
    maximum_entries_per_day: Optional[int] = None
    blacklist: bool = False
    notes: Optional[str] = None


class AccessPolicyUpdate(BaseModel):
    allowed_days: Optional[list[str]] = None
    allowed_time_ranges: Optional[list[dict]] = None
    expiration_date: Optional[datetime] = None
    maximum_entries_per_day: Optional[int] = None
    blacklist: Optional[bool] = None
    notes: Optional[str] = None


class AccessPolicyResponse(BaseModel):
    id: str = Field(alias="_id")
    policy_id: str
    target_type: str
    target_id: str
    allowed_days: list[str]
    allowed_time_ranges: list[dict]
    expiration_date: Optional[datetime] = None
    maximum_entries_per_day: Optional[int] = None
    blacklist: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
