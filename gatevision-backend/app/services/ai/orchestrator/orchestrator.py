import time
from dataclasses import dataclass, field
from typing import Optional

import numpy as np

from app.services.ai.camera.camera_service import CameraError
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.face_recognition.recognition_service import (
    FaceRecognitionService,
)
from app.services.ai.ocr.ocr_service import OcrService
from app.services.ai.orchestrator.exceptions import (
    ContextValidationError,
    PipelineExecutionError,
)
from app.services.ai.vehicle_fingerprint.fingerprint_service import (
    VehicleFingerprintService,
)
from app.services.decision.decision_engine import DecisionEngine
from app.services.gate.workflow_service import WorkflowService
from app.services.ai.orchestrator.execution_logger import PipelineLogger
from app.services.ai.orchestrator.metrics import get_pipeline_metrics
from app.services.ai.orchestrator.pipeline_context import PipelineContext
from app.services.ai.orchestrator.pipeline_result import PipelineResult, StageResult
from app.services.ai.orchestrator.workflow import WorkflowEngine
from app.services.ai.plate_detection.detection_service import DetectionService


@dataclass
class PipelineServices:
    detection_service: DetectionService = field(
        default_factory=lambda: DetectionService(
            detector=None, repository=None,
        )
    )
    ocr_service: OcrService = field(default_factory=OcrService)
    face_recognition_service: Optional[FaceRecognitionService] = None
    vehicle_fingerprint_service: Optional[VehicleFingerprintService] = None
    decision_engine: Optional[DecisionEngine] = None
    gate_workflow_service: Optional[WorkflowService] = None

    @classmethod
    def default(cls) -> "PipelineServices":
        return cls(
            detection_service=DetectionService(),
            ocr_service=OcrService(),
            face_recognition_service=None,
            vehicle_fingerprint_service=None,
            decision_engine=None,
        )


class PipelineOrchestrator:
    def __init__(
        self,
        services: Optional[PipelineServices] = None,
    ):
        self.services = services or PipelineServices.default()
        self.logger = PipelineLogger()
        self.metrics = get_pipeline_metrics()
        self._workflow = WorkflowEngine(self._build_stages())

    def _build_stages(self) -> list:
        stages = [
            self._capture_frame,
            self._detect_plates,
            self._crop_plates,
            self._recognize_plates,
        ]
        if self.services.face_recognition_service is not None:
            stages.append(self._recognize_faces)
        if self.services.vehicle_fingerprint_service is not None:
            stages.append(self._process_vehicle_fingerprint)
        stages.append(self._evaluate_decision)
        if self.services.decision_engine is not None and self.services.gate_workflow_service is not None:
            stages.append(self._process_gate_workflow)
        stages.append(self._aggregate_results)
        return stages

    async def execute_from_upload(
        self, data: bytes, camera_id: Optional[str] = None,
    ) -> PipelineResult:
        context = PipelineContext(camera_id=camera_id)
        context.add_timestamp("pipeline_start")

        frame = FrameProcessor.read_bytes(data)
        if frame is None:
            raise ContextValidationError("Failed to decode uploaded image")
        context.frame = frame
        context.frame_metadata = {
            "height": frame.shape[0],
            "width": frame.shape[1],
            "channels": frame.shape[2] if frame.ndim == 3 else 1,
        }

        return await self._execute(context)

    async def execute_from_camera(
        self, camera_id: str = "default",
    ) -> PipelineResult:
        context = PipelineContext(camera_id=camera_id)
        context.add_timestamp("pipeline_start")

        try:
            frame = self.services.detection_service.camera_service.capture()
        except CameraError as e:
            raise ContextValidationError(str(e)) from e
        if frame is None:
            raise ContextValidationError("Camera returned no frame")
        context.frame = frame
        context.frame_metadata = {
            "height": frame.shape[0],
            "width": frame.shape[1],
            "channels": frame.shape[2] if frame.ndim == 3 else 1,
        }

        return await self._execute(context)

    async def execute(
        self, context: PipelineContext,
    ) -> PipelineResult:
        return await self._execute(context)

    async def _execute(self, context: PipelineContext) -> PipelineResult:
        request_id = context.request_id
        stage_names = [s.__name__ for s in self._build_stages()]
        self.logger.pipeline_started(request_id, stage_names)

        start_total = time.perf_counter()

        try:
            stage_results = await self._workflow.execute(context)
        except Exception as e:
            self.logger.pipeline_completed(request_id, False, 0.0)
            raise PipelineExecutionError(f"Unexpected pipeline error: {e}") from e

        success = all(r.success for r in stage_results) if stage_results else False

        total_time = (time.perf_counter() - start_total) * 1000

        detected = self._build_detected_plates(context)
        recognized = self._build_recognized_plates(context)
        face_detections = self._build_face_detections(context)
        face_recognitions = self._build_face_recognitions(context)
        vehicle_detections = self._build_vehicle_detections(context)
        vehicle_fingerprints = self._build_vehicle_fingerprints(context)
        decision = context.decision
        gate_workflow_result = context.gate_workflow_result

        result = PipelineResult(
            success=success,
            request_id=request_id,
            total_processing_time=total_time,
            stage_results=stage_results,
            detected_plates=detected,
            recognized_plates=recognized,
            face_detections=face_detections,
            face_recognitions=face_recognitions,
            vehicle_detections=vehicle_detections,
            vehicle_fingerprints=vehicle_fingerprints,
            decision=decision,
            gate_workflow_result=gate_workflow_result,
            warnings=context.warnings,
            errors=context.errors,
        )

        for sr in stage_results:
            self.metrics.record_stage(
                sr.stage_name, sr.success, sr.duration_ms,
            )

        self.metrics.record_pipeline(
            request_id, success, total_time, len(stage_results),
        )
        self.logger.pipeline_completed(request_id, success, total_time)

        return result

    async def _capture_frame(self, context: PipelineContext) -> None:
        if context.frame is not None:
            return

        if context.camera_id:
            frame = self.services.detection_service.camera_service.capture()
            if frame is None:
                raise ContextValidationError(
                    "No frame available from camera"
                )
            context.frame = frame
            context.frame_metadata = {
                "height": frame.shape[0],
                "width": frame.shape[1],
                "channels": frame.shape[2] if frame.ndim == 3 else 1,
            }
            return

        raise ContextValidationError(
            "No frame provided and no camera specified"
        )

    async def _detect_plates(self, context: PipelineContext) -> None:
        if context.frame is None:
            raise ContextValidationError("No frame available for detection")

        result = await self.services.detection_service.detect_from_frame(
            frame=context.frame,
            image_id=context.uploaded_image_id or "pipeline",
        )
        context.detections = result.get("detections", [])

    async def _crop_plates(self, context: PipelineContext) -> None:
        if context.frame is None:
            return

        cropped = []
        for det in context.detections:
            bbox = det.get("bbox")
            if bbox and len(bbox) == 8:
                x_coords = [bbox[i] for i in range(0, 8, 2)]
                y_coords = [bbox[i] for i in range(1, 8, 2)]
                x1, y1 = max(0, min(x_coords)), max(0, min(y_coords))
                x2, y2 = min(context.frame.shape[1], max(x_coords)), min(
                    context.frame.shape[0], max(y_coords)
                )
                if x2 > x1 and y2 > y1:
                    crop = context.frame[y1:y2, x1:x2].copy()
                    cropped.append({
                        "image": crop,
                        "bbox": bbox,
                        "confidence": det.get("confidence", 0.0),
                        "cropped_plate_path": det.get("cropped_plate_path", ""),
                    })
        context.cropped_plates = cropped

    async def _recognize_plates(self, context: PipelineContext) -> None:
        for i, crop in enumerate(context.cropped_plates):
            plate_image = crop["image"]
            if plate_image.size == 0:
                context.ocr_results.append({
                    "plate_index": i,
                    "raw_text": "",
                    "cleaned_text": "",
                    "confidence": 0.0,
                    "validation_status": "error",
                    "validation_message": "Empty cropped image",
                })
                continue

            try:
                ocr_response = await self.services.ocr_service.read_from_image(
                    image=plate_image,
                )
                context.ocr_results.append({
                    "plate_index": i,
                    "raw_text": ocr_response.raw_text,
                    "cleaned_text": ocr_response.cleaned_text,
                    "confidence": ocr_response.confidence,
                    "validation_status": ocr_response.validation_status,
                    "validation_message": ocr_response.validation_message,
                })
            except Exception as e:
                context.ocr_results.append({
                    "plate_index": i,
                    "raw_text": "",
                    "cleaned_text": "",
                    "confidence": 0.0,
                    "validation_status": "error",
                    "validation_message": str(e),
                })

    async def _recognize_faces(self, context: PipelineContext) -> None:
        if context.frame is None:
            return

        svc = self.services.face_recognition_service
        if svc is None:
            return

        try:
            result = await svc.recognize_from_image(context.frame)
            context.face_detections = result.get("detections", [])
            context.face_recognition_results = [{
                "face_detected": result.get("face_detected", False),
                "face_count": result.get("face_count", 0),
                "similarity_score": result.get("similarity_score"),
                "matched": result.get("matched", False),
            }]
        except Exception as e:
            context.add_warning("face_recognition", str(e))

    async def _process_vehicle_fingerprint(self, context: PipelineContext) -> None:
        if context.frame is None:
            return

        svc = self.services.vehicle_fingerprint_service
        if svc is None:
            return

        try:
            result = await svc.extract_fingerprint(context.frame)
            context.vehicle_embeddings = [result.get("embedding", [])]
            context.vehicle_fingerprint_results = [{
                "dimension": result.get("dimension", 0),
                "duration_ms": result.get("duration_ms", 0.0),
                "plate_text": result.get("plate_text"),
            }]
        except Exception as e:
            context.add_warning("vehicle_fingerprint", str(e))

    async def _evaluate_decision(self, context: PipelineContext) -> None:
        engine = self.services.decision_engine
        if engine is None:
            return

        detected = self._build_detected_plates(context)
        recognized = self._build_recognized_plates(context)
        face_detections = self._build_face_detections(context)
        face_recognitions = self._build_face_recognitions(context)
        vehicle_detections = self._build_vehicle_detections(context)
        vehicle_fingerprints = self._build_vehicle_fingerprints(context)

        stub_result = PipelineResult(
            success=False,
            request_id=context.request_id,
            total_processing_time=0.0,
            stage_results=[],
            detected_plates=detected,
            recognized_plates=recognized,
            face_detections=face_detections,
            face_recognitions=face_recognitions,
            vehicle_detections=vehicle_detections,
            vehicle_fingerprints=vehicle_fingerprints,
            warnings=context.warnings,
            errors=context.errors,
        )

        try:
            output = await engine.evaluate_result(stub_result)
            context.decision = output.to_dict()
        except Exception as e:
            context.add_warning("decision_engine", str(e))
            context.decision = {
                "decision": "MANUAL_REVIEW",
                "overall_confidence": 0.0,
                "explanation": f"Decision engine error: {e}",
                "evidence": [],
                "error": str(e),
            }

    async def _process_gate_workflow(self, context: PipelineContext) -> None:
        svc = self.services.gate_workflow_service
        if svc is None:
            return
        decision = context.decision
        if not decision:
            return
        decision_value = decision.get("decision", "")
        if decision_value != "GRANT":
            context.gate_workflow_result = {
                "success": False,
                "action": "ENTRY",
                "message": f"Decision is '{decision_value}', not GRANT",
            }
            return
        recognized = self._build_recognized_plates(context)
        if not recognized:
            context.gate_workflow_result = {
                "success": False,
                "action": "ENTRY",
                "message": "No plate recognized",
            }
            return
        plate_text = recognized[0].get("plate", "")
        if not plate_text:
            context.gate_workflow_result = {
                "success": False,
                "action": "ENTRY",
                "message": "Empty plate text",
            }
            return
        try:
            result = await svc.run_entry_workflow(
                vehicle_id=plate_text,
                decision=decision_value,
                request_id=context.request_id,
            )
            context.gate_workflow_result = {
                "success": result.success,
                "action": result.action,
                "vehicle_id": result.vehicle_id,
                "message": result.message,
                "session": result.session,
                "transaction": result.transaction,
            }
            if result.error:
                context.gate_workflow_result["error"] = result.error
        except Exception as e:
            context.gate_workflow_result = {
                "success": False,
                "action": "ENTRY",
                "message": f"Gate workflow error: {e}",
                "error": str(e),
            }

    async def _aggregate_results(self, context: PipelineContext) -> None:
        pass

    def _build_detected_plates(self, context: PipelineContext) -> list:
        return [
            {
                "bbox": d.get("bbox", []),
                "confidence": d.get("confidence", 0.0),
                "cropped_plate_path": d.get("cropped_plate_path", ""),
            }
            for d in context.detections
        ]

    def _build_face_detections(self, context: PipelineContext) -> list:
        return [
            {
                "bbox": d.get("bbox", []),
                "confidence": d.get("confidence", 0.0),
                "cropped_face_path": d.get("cropped_face_path", ""),
            }
            for d in context.face_detections
        ]

    def _build_vehicle_detections(self, context: PipelineContext) -> list:
        if self.services.vehicle_fingerprint_service is None:
            return []
        return [{
            "detected": len(context.vehicle_embeddings) > 0,
            "embedding_count": len(context.vehicle_embeddings),
        }]

    def _build_vehicle_fingerprints(self, context: PipelineContext) -> list:
        if self.services.vehicle_fingerprint_service is None:
            return []
        return [
            {
                "dimension": r.get("dimension", 0),
                "duration_ms": r.get("duration_ms", 0.0),
                "plate_text": r.get("plate_text"),
            }
            for r in context.vehicle_fingerprint_results
        ]

    def _build_face_recognitions(self, context: PipelineContext) -> list:
        return [
            {
                "face_detected": r.get("face_detected", False),
                "face_count": r.get("face_count", 0),
                "similarity_score": r.get("similarity_score"),
                "matched": r.get("matched", False),
            }
            for r in context.face_recognition_results
        ]

    def _build_recognized_plates(self, context: PipelineContext) -> list:
        return [
            {
                "plate": r.get("cleaned_text", r.get("raw_text", "")),
                "confidence": r.get("confidence", 0.0),
                "validation_status": r.get("validation_status", "unchecked"),
            }
            for r in context.ocr_results
            if r.get("raw_text")
        ]
