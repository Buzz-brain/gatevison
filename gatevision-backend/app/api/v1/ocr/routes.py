import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query

from app.models.user import User, UserRole
from app.repositories.plate_detection_repository import PlateDetectionRepository
from app.schemas.ocr import (
    OcrHistoryResponse,
    OcrModelInfoResponse,
    OcrReadResponse,
    OcrResultResponse,
    OcrSearchResponse,
)
from app.security.dependencies import get_current_user, require_roles
from app.services.ai.ocr.ocr_loader import OcrLoader, OcrLoadError
from app.services.ai.ocr.ocr_service import OcrService
from app.services.ai.registry.model_registry import ModelRegistry

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ocr", tags=["OCR"])

SERVICE = OcrService()
DETECTION_REPO = PlateDetectionRepository()


@router.post("/read/upload", response_model=OcrReadResponse)
async def read_upload(
    file: UploadFile = File(...),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    data = await file.read()
    result = await SERVICE.read_from_bytes(data)
    return result


@router.post(
    "/read/detection/{plate_detection_id}",
    response_model=OcrReadResponse,
)
async def read_detection(
    plate_detection_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    detection = await DETECTION_REPO.get_by_id(plate_detection_id)
    if detection is None:
        raise HTTPException(
            status_code=404,
            detail=f"Plate detection {plate_detection_id} not found",
        )
    cropped_path = detection.cropped_plate_path
    if not cropped_path:
        raise HTTPException(
            status_code=400,
            detail="Detection has no cropped plate image",
        )

    result = await SERVICE.read_from_detection(plate_detection_id, cropped_path)
    return result


@router.get("/model-info", response_model=OcrModelInfoResponse)
async def get_ocr_model_info():
    loader = OcrLoader()
    meta = loader.get_metadata()
    return OcrModelInfoResponse(
        loaded=meta["loaded"],
        languages=meta["languages"],
        device=meta["device"],
    )


@router.get("/{result_id}", response_model=OcrResultResponse)
async def get_ocr_result(
    result_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    result = await SERVICE.get_result(result_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"OCR result {result_id} not found")
    return result


@router.get("/history", response_model=OcrHistoryResponse)
async def get_ocr_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    records = await SERVICE.get_history(skip=skip, limit=limit)
    return OcrHistoryResponse(
        results=records,
        total=len(records),
        skip=skip,
        limit=limit,
    )


@router.get("/search", response_model=OcrSearchResponse)
async def search_ocr(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    records = await SERVICE.search(q)
    return OcrSearchResponse(
        results=records,
        total=len(records),
        query=q,
    )


@router.post("/load-model")
async def load_ocr_model(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    loader = OcrLoader()
    try:
        loader.load()
        return {
            "success": True,
            "message": "OCR model loaded successfully",
            "data": loader.get_metadata(),
        }
    except OcrLoadError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/unload-model")
async def unload_ocr_model(
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.SECURITY_OFFICER])),
):
    loader = OcrLoader()
    loader.unload()
    return {"success": True, "message": "OCR model unloaded", "data": None}


@router.get("/health/model")
async def ocr_model_health():
    loader = OcrLoader()
    return {"healthy": loader.is_loaded(), "model": "easyocr"}


@router.get("/health/registry")
async def registry_health():
    registry = ModelRegistry()
    return {
        "health": registry.health_check(),
        "summary": registry.health_summary(),
    }


@router.post("/registry/unload-all")
async def registry_unload_all(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
):
    registry = ModelRegistry()
    count = registry.unload_all()
    return {
        "success": True,
        "message": f"Unloaded {count} models from registry",
        "data": None,
    }
