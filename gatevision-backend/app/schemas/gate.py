from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GateSessionResponse(BaseModel):
    session_id: str
    vehicle_id: str
    current_state: str
    last_entry_time: Optional[datetime] = None
    last_exit_time: Optional[datetime] = None
    active: bool
    created_at: datetime
    updated_at: datetime


class GateTransactionResponse(BaseModel):
    id: str = Field(alias="_id")
    transaction_id: str
    session_id: str
    vehicle_id: str
    driver_id: Optional[str] = None
    action: str
    decision: str
    timestamp: datetime
    request_id: Optional[str] = None
    gate_name: str
    notes: Optional[str] = None


class EntryRequest(BaseModel):
    request_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    plate: Optional[str] = None
    driver_id: Optional[str] = None
    gate_name: str = "Main Gate"
    gate_id: Optional[str] = None
    decision: str = "GRANT"
    notes: Optional[str] = None
    face_embedding: Optional[list[float]] = None
    vehicle_embedding: Optional[list[float]] = None
    face_confidence: Optional[float] = None
    vehicle_confidence: Optional[float] = None


class ExitRequest(BaseModel):
    request_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    plate: Optional[str] = None
    driver_id: Optional[str] = None
    gate_name: str = "Main Gate"
    gate_id: Optional[str] = None
    decision: str = "GRANT"
    notes: Optional[str] = None
    face_embedding: Optional[list[float]] = None
    vehicle_embedding: Optional[list[float]] = None
    face_confidence: Optional[float] = None
    vehicle_confidence: Optional[float] = None


class GateActionResponse(BaseModel):
    session: GateSessionResponse
    transaction: GateTransactionResponse
    message: str


class GateStatisticsResponse(BaseModel):
    vehicles_inside: int
    vehicles_outside: int
    total_sessions: int
    total_transactions: int
    entries_today: int
    today_transactions: int
