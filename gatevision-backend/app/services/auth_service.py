import logging
from datetime import timedelta
from fastapi import HTTPException, status

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import RegisterRequest, LoginRequest
from app.security.jwt import create_access_token
from app.security.password import hash_password, verify_password

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self):
        self.user_repository = UserRepository()

    async def register(self, data: RegisterRequest) -> dict:
        existing = await self.user_repository.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user_data = data.model_dump()
        user_data["password"] = hash_password(user_data["password"])
        user = await self.user_repository.create_from_dict(user_data)

        token = create_access_token({"sub": str(user.id)})
        refresh = create_access_token({"sub": str(user.id), "type": "refresh"}, expires_delta=timedelta(days=7))

        logger.info(f"New user registered: {user.email}")

        return {
            "access_token": token,
            "refresh_token": refresh,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "role": user.role.value,
            },
        }

    async def login(self, data: LoginRequest) -> dict:
        user = await self.user_repository.get_by_email(data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not verify_password(data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive",
            )

        token = create_access_token({"sub": str(user.id)})
        refresh = create_access_token({"sub": str(user.id), "type": "refresh"}, expires_delta=timedelta(days=7))

        logger.info(f"User logged in: {user.email}")

        return {
            "access_token": token,
            "refresh_token": refresh,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "role": user.role.value,
            },
        }

    async def get_current_user_info(self, user: User) -> dict:
        return {
            "id": str(user.id),
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        }
