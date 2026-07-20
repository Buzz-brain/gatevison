from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class EvidenceSchema(BaseModel):
    module_name: str
    confidence: float
    matched: bool
    score: Optional[float] = None
    metadata: dict = Field(default_factory=dict)
    processing_time: float = 0.0
    timestamp: str = ""


class FusionBreakdownSchema(BaseModel):
    module_name: str
    weight: float
    confidence: float
    contribution: float


class DecisionResponse(BaseModel):
    id: str = Field(alias="_id")
    request_id: str
    decision: str
    overall_confidence: float
    explanation: str
    evidence: list[dict]
    fusion_breakdown: dict
    triggered_rules: list[str]
    processing_time: float
    created_at: datetime


class DecisionHistoryResponse(BaseModel):
    id: str = Field(alias="_id")
    request_id: str
    decision: str
    overall_confidence: float
    explanation: str
    processing_time: float
    created_at: datetime


class DecisionStatisticsResponse(BaseModel):
    total_decisions: int
    grants: int
    denials: int
    manual_reviews: int
    grant_rate: float


class DecisionRulesResponse(BaseModel):
    weights: dict[str, float]
    thresholds: dict[str, float]
