from datetime import datetime, timezone
from enum import Enum
from beanie import Document, Indexed
from pydantic import Field, EmailStr


class UserRole(str, Enum):
    ADMIN = "admin"
    SECURITY_OFFICER = "security_officer"


class User(Document):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: Indexed(EmailStr, unique=True)
    password: str
    role: UserRole = UserRole.SECURITY_OFFICER
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "users"
        use_revision = True

    def __repr__(self) -> str:
        return f"<User {self.email}>"
