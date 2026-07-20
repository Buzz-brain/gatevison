from datetime import datetime
from typing import Optional

from beanie import Document
from pydantic import Field


class GateTransaction(Document):
    transaction_id: str = Field(unique=True, index=True)
    session_id: str = Field(index=True)
    vehicle_id: str = Field(index=True)
    driver_id: Optional[str] = None
    action: str
    decision: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None
    gate_name: str = "Main Gate"
    notes: Optional[str] = None

    class Settings:
        name = "gate_transactions"
        use_state_management = True

    def __repr__(self) -> str:
        return (
            f"GateTransaction(txn={self.transaction_id}, "
            f"vehicle={self.vehicle_id}, action={self.action})"
        )
