from typing import Optional
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.user import UserCreate, UserUpdate


class UserRepository(BaseRepository[User, UserCreate, UserUpdate]):
    def __init__(self):
        super().__init__(User)

    async def get_by_email(self, email: str) -> Optional[User]:
        return await self.get_by_field("email", email)

    async def get_active_users(self, skip: int = 0, limit: int = 100) -> list[User]:
        return await self.model.find(self.model.is_active == True).skip(skip).limit(limit).to_list()

    async def create_from_dict(self, data: dict) -> User:
        instance = self.model(**data)
        return await instance.insert()
