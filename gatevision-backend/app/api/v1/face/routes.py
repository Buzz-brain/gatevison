import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from app.schemas.face import (
    FaceCompareResponse,
    FaceHistoryResponse,
    FaceModelInfoResponse,
    FaceRecognizeResponse,
)
from app.services.ai.face_recognition.face_loader import FaceLoadError, FaceLoader
from app.services.ai.face_recognition.recognition_service import (
    FaceRecognitionService,
)
from app.services.ai.face_recognition.similarity import SimilarityService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/face", tags=["Face"])

SERVICE = FaceRecognitionService()


@router.post("/recognize/upload")
async def face_recognize_upload(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(None),
):
    try:
        data = await file.read()
        svc = FaceRecognitionService(
            similarity_service=SimilarityService(threshold=threshold) if threshold else None,
        )
        result = await svc.recognize_from_bytes(data)
        return {
            "success": True,
            "message": "Face recognition completed",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recognize/camera")
async def face_recognize_camera(
    camera_id: str = Query("default"),
    threshold: Optional[float] = Query(None),
):
    from app.services.ai.camera.camera_service import CameraService

    cam = CameraService()
    if not cam.is_running():
        raise HTTPException(status_code=400, detail="Camera is not running")

    try:
        frame = cam.capture()
        svc = FaceRecognitionService(
            similarity_service=SimilarityService(threshold=threshold) if threshold else None,
        )
        result = await svc.recognize_from_image(frame)
        return {
            "success": True,
            "message": "Face recognition completed",
            "data": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare")
async def face_compare(
    embedding_a: list[float],
    embedding_b: list[float],
    metric: str = Query("cosine"),
):
    svc = FaceRecognitionService()
    try:
        result = await svc.compare_embeddings(embedding_a, embedding_b, metric=metric)
        return {
            "success": True,
            "message": "Comparison completed",
            "data": result,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def face_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    records = await SERVICE.get_history(skip=skip, limit=limit)
    return {
        "success": True,
        "message": "Face recognition history retrieved",
        "data": {
            "results": [FaceHistoryResponse(**r) for r in records],
            "total": len(records),
            "skip": skip,
            "limit": limit,
        },
    }


@router.get("/model-info")
async def face_model_info():
    loader = FaceLoader()
    meta = loader.get_metadata()
    return {
        "success": True,
        "message": "Face model info retrieved",
        "data": FaceModelInfoResponse(
            loaded=meta["loaded"],
            model_name=meta["model_name"],
            device=meta["device"],
            version=meta["version"],
        ),
    }


@router.get("/health")
async def face_health():
    loader = FaceLoader()
    return {
        "success": True,
        "message": "Face recognition health",
        "data": {"healthy": loader.is_loaded(), "model": "insightface"},
    }


@router.get("/{record_id}")
async def face_get_record(record_id: str):
    record = await SERVICE.repository.get_by_id(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Face record not found")
    return {
        "success": True,
        "message": "Face record retrieved",
        "data": FaceHistoryResponse(
            id=str(record.id),
            detection_confidence=record.detection_confidence,
            similarity_score=record.similarity_score,
            matched=record.matched,
            inference_time=record.inference_time,
            created_at=record.created_at,
        ),
    }
