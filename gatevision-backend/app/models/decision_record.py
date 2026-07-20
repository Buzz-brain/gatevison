from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class DecisionRecord(Document):
    request_id: str = Field(index=True)
    overall_confidence: float = 0.0
    decision: str = ""
    explanation: str = ""
    evidence: list[dict] = Field(default_factory=list)
    fusion_breakdown: dict = Field(default_factory=dict)
    triggered_rules: list[str] = Field(default_factory=list)
    processing_time: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "decision_records"
        use_state_management = True

    def __repr__(self) -> str:
        return f"DecisionRecord(request={self.request_id}, decision={self.decision})"
