from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VehicleProfileCreate(BaseModel):
    vehicle_id: str
    plate_number: str
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    year: Optional[int] = None
    owner_id: Optional[str] = None
    registration_status: str = "active"


class VehicleProfileUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    year: Optional[int] = None
    owner_id: Optional[str] = None
    registration_status: Optional[str] = None
    vehicle_embedding_reference: Optional[list[float]] = None


class VehicleProfileResponse(BaseModel):
    id: str = Field(alias="_id")
    vehicle_id: str
    plate_number: str
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    year: Optional[int] = None
    owner_id: Optional[str] = None
    linked_driver_ids: list[str]
    vehicle_embedding_reference: Optional[list[float]] = None
    registration_status: str
    created_at: datetime
    updated_at: datetime


class VehicleEmbeddingUpdate(BaseModel):
    vehicle_embedding_reference: list[float]


class LinkDriversRequest(BaseModel):
    driver_ids: list[str]
