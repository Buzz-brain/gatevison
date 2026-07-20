import logging
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from app.schemas.vehicle import (
    VehicleHealthResponse,
    VehicleModelInfo,
    VerifyResult,
)
from app.services.ai.vehicle_fingerprint.fingerprint_service import (
    VehicleFingerprintError,
    VehicleFingerprintService,
)
from app.services.ai.vehicle_fingerprint.vehicle_loader import VehicleLoader

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/vehicle", tags=["Vehicle"])

SERVICE = VehicleFingerprintService()


@router.post("/fingerprint/upload")
async def vehicle_fingerprint_upload(
    file: UploadFile = File(...),
    plate_text: Optional[str] = Query(None),
):
    try:
        data = await file.read()
        svc = VehicleFingerprintService()
        import cv2
        import numpy as np

        buf = np.frombuffer(data, dtype=np.uint8)
        image = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image")

        result = await svc.extract_fingerprint(image, plate_text=plate_text)
        return {
            "success": True,
            "message": "Vehicle fingerprint extracted",
            "data": result,
        }
    except VehicleFingerprintError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/fingerprint/camera")
async def vehicle_fingerprint_camera(
    camera_id: str = Query("default"),
    plate_text: Optional[str] = Query(None),
):
    from app.services.ai.camera.camera_service import CameraService

    cam = CameraService()
    if not cam.is_running():
        raise HTTPException(status_code=400, detail="Camera is not running")

    try:
        frame = cam.capture()
        svc = VehicleFingerprintService()
        result = await svc.extract_fingerprint(frame, plate_text=plate_text)
        return {
            "success": True,
            "message": "Vehicle fingerprint extracted",
            "data": result,
        }
    except VehicleFingerprintError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/store")
async def vehicle_fingerprint_store(
    plate_text: str = Query(...),
    embedding: list[float] = Query(...),
):
    try:
        record = await SERVICE.store_fingerprint(plate_text, embedding)
        return {
            "success": True,
            "message": "Vehicle fingerprint stored",
            "data": {
                "id": str(record.id),
                "plate_text": record.plate_text,
                "dimension": record.dimension,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/lookup")
async def vehicle_lookup(
    file: UploadFile = File(...),
    top_k: int = Query(5, ge=1, le=50),
):
    try:
        data = await file.read()
        import cv2
        import numpy as np

        buf = np.frombuffer(data, dtype=np.uint8)
        image = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image")

        svc = VehicleFingerprintService()
        matches = await svc.lookup(image, top_k=top_k)
        return {
            "success": True,
            "message": "Vehicle lookup completed",
            "data": {"matches": matches, "count": len(matches)},
        }
    except VehicleFingerprintError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify")
async def vehicle_verify(
    file: UploadFile = File(...),
    plate_text: str = Query(...),
):
    try:
        data = await file.read()
        import cv2
        import numpy as np

        buf = np.frombuffer(data, dtype=np.uint8)
        image = cv2.imdecode(buf, cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image")

        svc = VehicleFingerprintService()
        result = await svc.verify(image, plate_text)
        return {
            "success": True,
            "message": "Vehicle verification completed",
            "data": result,
        }
    except VehicleFingerprintError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/fingerprint")
async def vehicle_fingerprint_delete(plate_text: str = Query(...)):
    deleted = await SERVICE.delete_fingerprint(plate_text)
    if not deleted:
        raise HTTPException(status_code=404, detail="Fingerprint not found")
    return {
        "success": True,
        "message": "Vehicle fingerprint deleted",
    }


@router.get("/model-info")
async def vehicle_model_info():
    svc = VehicleFingerprintService()
    info = svc.get_model_info()
    return {
        "success": True,
        "message": "Vehicle model info retrieved",
        "data": info,
    }


@router.get("/health")
async def vehicle_health():
    svc = VehicleFingerprintService()
    return {
        "success": True,
        "message": "Vehicle fingerprint health",
        "data": svc.health(),
    }
