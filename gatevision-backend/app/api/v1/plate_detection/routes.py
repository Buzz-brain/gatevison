import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query

from app.config.settings import settings
from app.security.dependencies import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.plate_detection import (
    DetectionHistoryResponse,
    ModelInfoResponse,
    PlateDetectResponse,
    PlateDetectionResponse,
)
from app.services.ai.plate_detection.detection_service import DetectionService
from app.services.ai.plate_detection.model_loader import ModelLoader, ModelLoadError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plate-detection", tags=["Plate Detection"])

SERVICE = DetectionService()


@router.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    loader = ModelLoader()
    meta = loader.get_metadata()
    return ModelInfoResponse(
        loaded=meta["loaded"],
        model_path=meta["model_path"],
        device=meta["device"],
        model_version=meta["model_version"],
    )


@router.post("/load-model")
async def load_model(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
    model_path: Optional[str] = None,
    device: Optional[str] = None,
):
    loader = ModelLoader()
    try:
        loader.load(model_path=model_path, device=device)
        return {"success": True, "message": "Model loaded successfully", "data": loader.get_metadata()}
    except ModelLoadError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/unload-model")
async def unload_model(current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER]))):
    loader = ModelLoader()
    loader.unload()
    return {"success": True, "message": "Model unloaded", "data": None}


@router.post("/detect/upload", response_model=PlateDetectResponse)
async def detect_from_upload(
    file: UploadFile = File(...),
    conf_threshold: Optional[float] = Query(None, ge=0.0, le=1.0),
    annotate: bool = Query(False),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    data = await file.read()
    result = await SERVICE.detect_from_upload(
        data, conf_threshold=conf_threshold, annotate=annotate
    )
    return result


@router.post("/detect/camera", response_model=PlateDetectResponse)
async def detect_from_camera(
    conf_threshold: Optional[float] = Query(None, ge=0.0, le=1.0),
    annotate: bool = Query(False),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    result = await SERVICE.detect_from_camera(
        conf_threshold=conf_threshold, annotate=annotate
    )
    return result


@router.get("/history", response_model=DetectionHistoryResponse)
async def get_detection_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    records = await SERVICE.get_history(skip=skip, limit=limit)
    return DetectionHistoryResponse(
        detections=records,
        total=len(records),
        skip=skip,
        limit=limit,
    )


@router.get("/{detection_id}", response_model=PlateDetectionResponse)
async def get_detection(
    detection_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    result = await SERVICE.get_detection(detection_id)
    if result is None:
        raise HTTPException(
            status_code=404, detail=f"Detection {detection_id} not found"
        )
    return result


@router.get("/health/model")
async def model_health():
    loader = ModelLoader()
    return loader.health_check()
