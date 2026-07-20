import logging
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.security.password import hash_password

logger = logging.getLogger(__name__)


class UserService:
    def __init__(self):
        self.user_repository = UserRepository()

    async def create_user(self, data: UserCreate) -> UserResponse:
        existing = await self.user_repository.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user_data = data.model_dump()
        user_data["password"] = hash_password(user_data["password"])
        user = await self.user_repository.create_from_dict(user_data)

        logger.info(f"User created by admin: {user.email}")
        return self._to_response(user)

    async def get_user(self, user_id: str) -> UserResponse:
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return self._to_response(user)

    async def get_users(self, skip: int = 0, limit: int = 100) -> list[UserResponse]:
        users = await self.user_repository.get_all(skip, limit)
        return [self._to_response(u) for u in users]

    async def update_user(self, user_id: str, data: UserUpdate) -> UserResponse:
        if data.password:
            data.password = hash_password(data.password)
        user = await self.user_repository.update(user_id, data)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return self._to_response(user)

    async def delete_user(self, user_id: str) -> None:
        deleted = await self.user_repository.delete(user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        logger.info(f"User deleted: {user_id}")

    def _to_response(self, user) -> UserResponse:
        return UserResponse(
            id=str(user.id),
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
