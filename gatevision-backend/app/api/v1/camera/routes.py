import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.image import ImageCategory
from app.models.user import User, UserRole
from app.schemas.response import APIResponse
from app.security.dependencies import get_current_user, require_roles
from app.services.ai.camera.camera_service import CameraService, CameraError
from app.services.ai.camera.image_service import ImageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/camera", tags=["Camera"])

camera_service = CameraService()
image_service = ImageService(camera_service=camera_service)


@router.post("/start", response_model=APIResponse)
async def start_camera(
    source: int = 0,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    try:
        result = camera_service.start(source=source)
        return APIResponse(success=True, message="Camera started", data=result)
    except CameraError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/stop", response_model=APIResponse)
async def stop_camera(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    try:
        result = camera_service.stop()
        return APIResponse(success=True, message="Camera stopped", data=result)
    except CameraError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("/status", response_model=APIResponse)
async def get_camera_status(
    current_user: User = Depends(get_current_user),
):
    result = camera_service.status()
    return APIResponse(success=True, message="Camera status retrieved", data=result)


@router.post("/capture", response_model=APIResponse)
async def capture_image(
    category: ImageCategory = ImageCategory.TEMP,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    try:
        result = await image_service.capture_and_save(category=category)
        return APIResponse(success=True, message="Image captured and saved", data=result.model_dump())
    except CameraError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/detect", response_model=APIResponse)
async def detect_cameras(
    current_user: User = Depends(get_current_user),
):
    cameras = CameraService.detect_cameras()
    return APIResponse(
        success=True,
        message=f"Found {len(cameras)} camera(s)",
        data={"cameras": cameras, "count": len(cameras)},
    )
