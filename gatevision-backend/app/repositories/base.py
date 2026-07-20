from typing import Generic, Optional, TypeVar
from beanie import Document, PydanticObjectId
from pydantic import BaseModel

ModelType = TypeVar("ModelType", bound=Document)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: type[ModelType]):
        self.model = model

    async def create(self, data: CreateSchemaType) -> ModelType:
        instance = self.model(**data.model_dump())
        return await instance.insert()

    async def get_by_id(self, id: str) -> Optional[ModelType]:
        return await self.model.get(PydanticObjectId(id))

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[ModelType]:
        return await self.model.find_all().skip(skip).limit(limit).to_list()

    async def get_by_field(self, field: str, value) -> Optional[ModelType]:
        return await self.model.find_one({field: value})

    async def update(self, id: str, data: UpdateSchemaType) -> Optional[ModelType]:
        instance = await self.get_by_id(id)
        if not instance:
            return None
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(instance, key, value)
        await instance.save()
        return instance

    async def delete(self, id: str) -> bool:
        instance = await self.get_by_id(id)
        if not instance:
            return False
        await instance.delete()
        return True

    async def count(self) -> int:
        return await self.model.find_all().count()
