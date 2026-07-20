from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DriverProfileCreate(BaseModel):
    driver_id: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    status: str = "active"


class DriverProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    face_embedding_reference: Optional[list[float]] = None


class DriverProfileResponse(BaseModel):
    id: str = Field(alias="_id")
    driver_id: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    face_embedding_reference: Optional[list[float]] = None
    status: str
    created_at: datetime
    updated_at: datetime


class DriverFaceEmbeddingUpdate(BaseModel):
    face_embedding_reference: list[float]
