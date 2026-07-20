from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest
from app.schemas.response import APIResponse
from app.security.dependencies import get_current_user
from app.security.jwt import decode_access_token, create_access_token
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
async def register(data: RegisterRequest):
    auth_service = AuthService()
    result = await auth_service.register(data)
    return APIResponse(
        success=True,
        message="Registration successful",
        data=result,
    )


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
)
async def login(data: LoginRequest):
    auth_service = AuthService()
    result = await auth_service.login(data)
    return APIResponse(
        success=True,
        message="Login successful",
        data=result,
    )


@router.post(
    "/refresh",
    response_model=APIResponse,
    status_code=status.HTTP_200_OK,
)
async def refresh_token(data: RefreshRequest):
    payload = decode_access_token(data.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload",
        )
    user_repo = AuthService().user_repository
    user = await user_repo.get_by_id(user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    new_token = create_access_token({"sub": str(user.id)})
    new_refresh = create_access_token({"sub": str(user.id), "type": "refresh"}, expires_delta=timedelta(days=7))
    return APIResponse(
        success=True,
        message="Token refreshed",
        data={
            "access_token": new_token,
            "refresh_token": new_refresh,
            "token_type": "bearer",
        },
    )


@router.get(
    "/me",
    response_model=APIResponse,
    status_code=status.HTTP_200_OK,
)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    auth_service = AuthService()
    user_info = await auth_service.get_current_user_info(current_user)
    return APIResponse(
        success=True,
        message="User retrieved successfully",
        data=user_info,
    )
