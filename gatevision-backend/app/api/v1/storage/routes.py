import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.models.user import User, UserRole
from app.schemas.response import APIResponse
from app.security.dependencies import get_current_user, require_roles
from app.services.ai.camera.image_service import ImageService
from app.services.ai.camera.storage_service import ImageStorageService
from app.config.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/storage", tags=["Storage"])

image_service = ImageService()
storage_service = ImageStorageService()


@router.get("/images", response_model=APIResponse)
async def list_images(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
):
    images = await image_service.get_images(skip=skip, limit=limit)
    return APIResponse(
        success=True,
        message=f"Retrieved {len(images)} image(s)",
        data=[img.model_dump() for img in images],
    )


@router.get("/image/{image_id}", response_model=APIResponse)
async def get_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
):
    image = await image_service.get_image(image_id)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    return APIResponse(
        success=True,
        message="Image retrieved successfully",
        data=image.model_dump(),
    )


@router.delete("/image/{image_id}", response_model=APIResponse)
async def delete_image(
    image_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    deleted = await image_service.delete_image(image_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    return APIResponse(
        success=True,
        message="Image deleted successfully",
        data=None,
    )


@router.get("/image/{image_id}/file", response_model=APIResponse)
async def get_image_file(
    image_id: str,
    current_user: User = Depends(get_current_user),
):
    image = await image_service.get_image(image_id)
    if image is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    filepath = storage_service.get_path(image.filepath)
    if filepath is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found on disk",
        )
    from fastapi.responses import FileResponse
    return FileResponse(
        path=str(filepath),
        media_type=image.mime_type,
        filename=image.filename,
    )
