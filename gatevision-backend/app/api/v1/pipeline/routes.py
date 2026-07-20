import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Query

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
from app.services.ai.orchestrator.exceptions import PipelineExecutionError
from app.services.ai.orchestrator.metrics import get_pipeline_metrics
from app.services.ai.orchestrator.orchestrator import (
    PipelineOrchestrator,
    PipelineServices,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/pipeline", tags=["Pipeline"])


def get_orchestrator() -> PipelineOrchestrator:
    services = PipelineServices.default()
    return PipelineOrchestrator(services=services)


@router.post("/process/upload")
async def pipeline_process_upload(
    file: UploadFile = File(...),
    camera_id: Optional[str] = Query(None),
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator),
):
    try:
        data = await file.read()
        result = await orchestrator.execute_from_upload(
            data, camera_id=camera_id,
        )
        return _to_api_response(result)
    except PipelineExecutionError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process/camera")
async def pipeline_process_camera(
    camera_id: str = Query("default"),
    orchestrator: PipelineOrchestrator = Depends(get_orchestrator),
):
    try:
        result = await orchestrator.execute_from_camera(camera_id=camera_id)
        return _to_api_response(result)
    except PipelineExecutionError as e:
        raise HTTPException(status_code=500, detail=str(e))


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

    return {
        "success": result.success,
        "message": "Pipeline executed successfully" if result.success
        else "Pipeline completed with errors",
        "data": data,
    }
