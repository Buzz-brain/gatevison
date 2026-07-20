from fastapi import APIRouter, Depends, status, Query

from app.models.user import User, UserRole
from app.schemas.response import APIResponse
from app.schemas.user import UserCreate, UserUpdate
from app.security.dependencies import get_current_user, require_roles
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "",
    response_model=APIResponse,
    status_code=status.HTTP_200_OK,
)
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    user_service = UserService()
    users = await user_service.get_users(skip, limit)
    return APIResponse(
        success=True,
        message="Users retrieved successfully",
        data=[user.model_dump() for user in users],
    )


@router.get(
    "/{user_id}",
    response_model=APIResponse,
    status_code=status.HTTP_200_OK,
)
async def get_user(
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    user_service = UserService()
    user = await user_service.get_user(user_id)
    return APIResponse(
        success=True,
        message="User retrieved successfully",
        data=user.model_dump(),
    )


@router.put(
    "/{user_id}",
    response_model=APIResponse,
    status_code=status.HTTP_200_OK,
)
async def update_user(
    user_id: str,
    data: UserUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    user_service = UserService()
    user = await user_service.update_user(user_id, data)
    return APIResponse(
        success=True,
        message="User updated successfully",
        data=user.model_dump(),
    )


@router.delete(
    "/{user_id}",
    response_model=APIResponse,
    status_code=status.HTTP_200_OK,
)
async def delete_user(
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    user_service = UserService()
    await user_service.delete_user(user_id)
    return APIResponse(
        success=True,
        message="User deleted successfully",
        data=None,
    )
