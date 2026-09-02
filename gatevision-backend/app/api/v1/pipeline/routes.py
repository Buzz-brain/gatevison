import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query, Request

from app.schemas.pipeline import (
    FaceRecognitionResult,
    PipelineData,
    PipelineMetricsResponse,
    PipelineRequestHistory,
    PipelineStatusResponse,
    RecognizedPlate,
    StageMetricsResponse,
    StageResultResponse,
)
from app.services.ai.orchestrator.exceptions import (
    ContextValidationError,
    PipelineExecutionError,
)
from app.services.ai.orchestrator.metrics import get_pipeline_metrics
from app.services.ai.orchestrator.orchestrator import (
    PipelineOrchestrator,
    PipelineServices,
)
from app.services.ai.orchestrator.pending_vehicle_service import PendingVehicleService
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.camera.camera_service import CameraError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


def get_orchestrator() -> PipelineOrchestrator:
    services = PipelineServices.default()
    return PipelineOrchestrator(services=services)


def get_pending_vehicle_service() -> PendingVehicleService:
    return PendingVehicleService()


@router.post("/process/upload")
async def pipeline_process_upload(
    file: UploadFile = File(...),
    face_file: Optional[UploadFile] = File(None),
    camera_id: Optional[str] = Query(None),
    direction: str = Query("entry", pattern="^(entry|exit)$"),
    require_face: Optional[bool] = Query(None),
    finalize: Optional[bool] = Query(None),
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator),
    request: Request = None,
):
    try:
        data = await file.read()
        face_data = await face_file.read() if face_file is not None else None
        result = await orchestrator.execute_from_upload(
            data,
            camera_id=camera_id,
            direction=direction,
            request_id=getattr(request.state, "request_id", None),
            require_face=require_face,
            face_data=face_data,
            finalize=finalize,
        )
        return _to_api_response(result)
    except ContextValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except PipelineExecutionError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process/camera")
async def pipeline_process_camera(
    camera_id: str = Query("default"),
    direction: str = Query("entry", pattern="^(entry|exit)$"),
    require_face: Optional[bool] = Query(None),
    finalize: Optional[bool] = Query(None),
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator),
    request: Request = None,
):
    try:
        result = await orchestrator.execute_from_camera(
            camera_id=camera_id,
            direction=direction,
            request_id=getattr(request.state, "request_id", None),
            require_face=require_face,
            finalize=finalize,
        )
        return _to_api_response(result)
    except ContextValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except PipelineExecutionError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/pending")
async def pipeline_create_pending(
    camera_id: str = Query("default"),
    direction: str = Query("entry", pattern="^(entry|exit)$"),
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator),
    pending_svc: PendingVehicleService = Depends(get_pending_vehicle_service),
    request: Request = None,
):
    """System-side vehicle scan: capture a frame from the attached camera, run
    the vehicle-only sub-stages, and store a single-use pending vehicle record
    awaiting a driver's face from the operator (Live Gate).
    """
    try:
        frame, result = await orchestrator.capture_vehicle_preview(
            camera_id=camera_id,
            direction=direction,
            request_id=getattr(request.state, "request_id", None),
        )
    except CameraError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ContextValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except PipelineExecutionError as e:
        raise HTTPException(status_code=500, detail=str(e))

    pending = await pending_svc.create_from_result(
        result, direction=direction, frame=frame, source="camera"
    )

    payload = _to_api_response(result)
    payload["data"]["pending_vehicle"] = PendingVehicleService.to_dict(pending)
    return payload


@router.post("/pending/from-frame")
async def pipeline_create_pending_from_frame(
    frame_file: UploadFile = File(...),
    direction: str = Query("entry", pattern="^(entry|exit)$"),
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator),
    pending_svc: PendingVehicleService = Depends(get_pending_vehicle_service),
    request: Request = None,
):
    """Hybrid hand-off: store a pending vehicle record built from a caller-
    supplied frame (any device's browser camera), so the driver's face can be
    completed on the other device.

    Runs only the vehicle sub-stages against the uploaded frame - no gate /
    finalize effects here. The pending's direction and plate come from this
    frame, and a later /pending/complete supplies the face to finalize.
    """
    try:
        frame_data = await frame_file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not frame_data:
        raise HTTPException(status_code=422, detail="Empty vehicle frame")

    try:
        frame, result = await orchestrator.pending_from_frame(
            frame_data=frame_data,
            direction=direction,
            request_id=getattr(request.state, "request_id", None),
        )
    except ContextValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except PipelineExecutionError as e:
        raise HTTPException(status_code=500, detail=str(e))

    pending = await pending_svc.create_from_result(
        result, direction=direction, frame=frame, source="frame"
    )

    payload = _to_api_response(result)
    payload["data"]["pending_vehicle"] = PendingVehicleService.to_dict(pending)
    return payload


@router.get("/pending")
async def pipeline_get_pending(
    direction: str = Query("entry", pattern="^(entry|exit)$"),
    pending_svc: PendingVehicleService = Depends(get_pending_vehicle_service),
):
    """Return the most recent non-expired pending vehicle awaiting a face."""
    pending = await pending_svc.get_latest(direction=direction)
    if pending is None:
        return {
            "success": True,
            "message": "No pending vehicle",
            "data": None,
        }
    return {
        "success": True,
        "message": "Pending vehicle found",
        "data": PendingVehicleService.to_dict(pending),
    }


@router.post("/pending/complete")
async def pipeline_complete_pending(
    pending_id: str = Query(...),
    face_file: UploadFile = File(...),
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator),
    pending_svc: PendingVehicleService = Depends(get_pending_vehicle_service),
    request: Request = None,
):
    """Complete a pending vehicle identity check.

    The driver's face photo (from the operator phone) is merged with the vehicle
    frame already stored by the system camera, and the full pipeline runs once -
    producing a single decision, gate session and history record.
    """
    pending = await pending_svc.repository.get(pending_id)
    if pending is None:
        raise HTTPException(status_code=404, detail="Pending vehicle not found")

    try:
        face_data = await face_file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Direction and plate are governed by the stored pending record so the
    # system camera and the operator phone always agree.
    direction = pending.direction

    try:
        result = await orchestrator.execute_from_pending(
            frame_data=pending.frame,
            direction=direction,
            request_id=getattr(request.state, "request_id", None),
            face_data=face_data,
            require_face=True,
            finalize=True,
        )
    except ContextValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except PipelineExecutionError as e:
        raise HTTPException(status_code=500, detail=str(e))

    await pending_svc.consume(pending_id)

    payload = _to_api_response(result)
    payload["data"]["pending_vehicle"] = PendingVehicleService.to_dict(pending)
    return payload


@router.get("/status")
async def pipeline_status():
    metrics = get_pipeline_metrics()
    snapshot = metrics.snapshot()
    recent = metrics.get_recent_requests(5)
    return {
        "success": True,
        "message": "Pipeline status retrieved",
        "data": PipelineStatusResponse(
            healthy=True,
            total_pipelines=snapshot.total_pipelines,
            recent_requests=recent,
        ),
    }


@router.get("/metrics")
async def pipeline_metrics():
    metrics = get_pipeline_metrics()
    snapshot = metrics.snapshot()
    return {
        "success": True,
        "message": "Pipeline metrics retrieved",
        "data": PipelineMetricsResponse(
            total_pipelines=snapshot.total_pipelines,
            success_count=snapshot.success_count,
            failure_count=snapshot.failure_count,
            avg_total_duration_ms=snapshot.avg_total_duration_ms,
            stages=[
                StageMetricsResponse(
                    stage_name=s.stage_name,
                    total_calls=s.total_calls,
                    success_count=s.success_count,
                    failure_count=s.failure_count,
                    avg_duration_ms=s.avg_duration_ms,
                )
                for s in snapshot.stages
            ],
        ),
    }


@router.get("/request/{request_id}")
async def pipeline_request_history(
    request_id: str,
):
    metrics = get_pipeline_metrics()
    recent = metrics.get_recent_requests(100)
    for entry in recent:
        if entry["request_id"] == request_id:
            return {
                "success": True,
                "message": "Request found",
                "data": entry,
            }
    raise HTTPException(
        status_code=404,
        detail=f"Request {request_id} not found",
    )


def _to_api_response(result):
    recognized = []
    for r in result.recognized_plates:
        recognized.append(RecognizedPlate(
            plate=r.get("plate", ""),
            confidence=r.get("confidence", 0.0),
            validation_status=r.get("validation_status", "unchecked"),
        ))

    stage_results = [
        StageResultResponse(
            stage_name=s.stage_name,
            success=s.success,
            duration_ms=round(s.duration_ms, 2),
            error=s.error,
        )
        for s in result.stage_results
    ]

    face_recs = [
        FaceRecognitionResult(
            face_detected=r.get("face_detected", False),
            face_count=r.get("face_count", 0),
            similarity_score=r.get("similarity_score"),
            matched=r.get("matched", False),
            matched_driver_id=r.get("matched_driver_id"),
            matched_driver_name=r.get("matched_driver_name"),
            embedding_distance=r.get("embedding_distance"),
        )
        for r in result.face_recognitions
    ]

    data = PipelineData(
        request_id=result.request_id,
        plates_detected=len(result.detected_plates),
        plates_recognized=len(result.recognized_plates),
        recognized_plates=recognized,
        faces_detected=len(result.face_detections),
        face_recognitions=face_recs,
        processing_time_ms=round(result.total_processing_time, 2),
        stage_results=stage_results,
        warnings=result.warnings,
        errors=result.errors,
    )

    payload = {
        "success": result.success,
        "message": "Pipeline executed successfully" if result.success
        else "Pipeline completed with errors",
        "data": data.model_dump(),
    }

    if result.decision:
        payload["data"]["decision"] = result.decision
    if result.gate_workflow_result:
        payload["data"]["gate_workflow_result"] = result.gate_workflow_result

    return payload
