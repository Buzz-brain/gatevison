import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import numpy as np

logger = logging.getLogger(__name__)

from app.config.settings import settings
from app.models.decision_record import DecisionRecord
from app.repositories.decision_repository import DecisionRepository
from app.repositories.driver_profile_repository import DriverProfileRepository
from app.services.ai.camera.camera_service import CameraError, CameraService
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.embedding.similarity_engine import SimilarityEngine
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
from app.services.admin.manual_review_service import ManualReviewService
from app.services.gate.workflow_service import WorkflowService
from app.services.ai.orchestrator.execution_logger import PipelineLogger
from app.services.ai.orchestrator.metrics import get_pipeline_metrics
from app.services.ai.orchestrator.pipeline_context import PipelineContext
from app.services.ai.orchestrator.pipeline_result import PipelineResult
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
            face_recognition_service=FaceRecognitionService(),
            vehicle_fingerprint_service=VehicleFingerprintService(),
            decision_engine=DecisionEngine(),
            gate_workflow_service=WorkflowService(),
        )


def _log_pipeline_services(services: PipelineServices) -> None:
    def face_state() -> str:
        if services.face_recognition_service is None:
            return "disabled"
        return (
            "enabled(model_ready)"
            if services.face_recognition_service.is_available()
            else "enabled(model_not_downloaded)"
        )

    def vehicle_state() -> str:
        if services.vehicle_fingerprint_service is None:
            return "disabled"
        return (
            "enabled(model_ready)"
            if services.vehicle_fingerprint_service.is_available()
            else "enabled(model_not_downloaded)"
        )

    logger.info(
        "Pipeline AI services configured | event=pipeline_services "
        "| detection=%s | ocr=%s | face=%s | vehicle=%s "
        "| decision=%s | gate_workflow=%s",
        type(services.detection_service).__name__,
        type(services.ocr_service).__name__,
        face_state(),
        vehicle_state(),
        type(services.decision_engine).__name__
        if services.decision_engine else "disabled",
        type(services.gate_workflow_service).__name__
        if services.gate_workflow_service else "disabled",
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
        _log_pipeline_services(self.services)

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
        stages.append(self._persist_decision)
        if self.services.decision_engine is not None and self.services.gate_workflow_service is not None:
            stages.append(self._process_gate_workflow)
        stages.append(self._aggregate_results)
        return stages

    async def execute_from_upload(
        self,
        data: bytes,
        camera_id: Optional[str] = None,
        direction: str = "entry",
        request_id: Optional[str] = None,
        require_face: Optional[bool] = None,
        face_data: Optional[bytes] = None,
        finalize: Optional[bool] = None,
    ) -> PipelineResult:
        context = PipelineContext(
            camera_id=camera_id,
            direction=direction,
            require_face=require_face,
            finalize=finalize if finalize is not None else True,
        )
        if request_id:
            context.request_id = request_id
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

        if face_data is not None:
            face_frame = FrameProcessor.read_bytes(face_data)
            if face_frame is None:
                raise ContextValidationError("Failed to decode uploaded face image")
            context.face_frame = face_frame
            context.face_frame_metadata = {
                "height": face_frame.shape[0],
                "width": face_frame.shape[1],
                "channels": face_frame.shape[2] if face_frame.ndim == 3 else 1,
            }

        return await self._execute(context)

    async def execute_from_camera(
        self, camera_id: str = "default", direction: str = "entry",
        request_id: Optional[str] = None,
        require_face: Optional[bool] = None,
        finalize: Optional[bool] = None,
    ) -> PipelineResult:
        context = PipelineContext(
            camera_id=camera_id,
            direction=direction,
            require_face=require_face,
            finalize=finalize if finalize is not None else True,
        )
        if request_id:
            context.request_id = request_id
        context.add_timestamp("pipeline_start")

        camera_svc = self.services.detection_service.camera_service
        try:
            frame = camera_svc.capture()
        except CameraError as e:
            raise ContextValidationError(str(e)) from e
        if frame is None:
            raise ContextValidationError("Camera returned no frame")

        if isinstance(camera_svc, CameraService):
            if (
                settings.CAMERA_AVOID_DUPLICATE_PROCESSING
                and camera_svc.is_duplicate_of_processed(frame)
            ):
                raise ContextValidationError(
                    "Duplicate frame - no new vehicle activity detected"
                )

        context.frame = frame
        context.frame_metadata = {
            "height": frame.shape[0],
            "width": frame.shape[1],
            "channels": frame.shape[2] if frame.ndim == 3 else 1,
        }

        result = await self._execute(context)
        if isinstance(camera_svc, CameraService):
            camera_svc.note_processed(frame)
        return result

    async def execute_from_pending(
        self,
        frame_data: bytes,
        direction: str = "entry",
        request_id: Optional[str] = None,
        face_data: Optional[bytes] = None,
        require_face: Optional[bool] = None,
        finalize: Optional[bool] = None,
    ) -> PipelineResult:
        """Run the full pipeline against a vehicle frame captured earlier by the
        system camera, combined with a newly provided face image.

        Used by the two-camera fusion flow: the system scans the vehicle and the
        operator phone supplies only the driver's face. Plates / vehicle
        fingerprint come from the stored frame; face recognition runs on the
        face image. Direction is determined by the stored pending record.
        """
        context = PipelineContext(
            direction=direction,
            require_face=require_face,
            finalize=finalize if finalize is not None else True,
        )
        if request_id:
            context.request_id = request_id
        context.add_timestamp("pipeline_start")

        frame = FrameProcessor.read_bytes(frame_data)
        if frame is None:
            raise ContextValidationError("Failed to decode stored vehicle frame")
        context.frame = frame
        context.frame_metadata = {
            "height": frame.shape[0],
            "width": frame.shape[1],
            "channels": frame.shape[2] if frame.ndim == 3 else 1,
        }

        if face_data is not None:
            face_frame = FrameProcessor.read_bytes(face_data)
            if face_frame is None:
                raise ContextValidationError("Failed to decode uploaded face image")
            context.face_frame = face_frame
            context.face_frame_metadata = {
                "height": face_frame.shape[0],
                "width": face_frame.shape[1],
                "channels": face_frame.shape[2] if face_frame.ndim == 3 else 1,
            }

        return await self._execute(context)

    async def capture_vehicle_preview(
        self,
        camera_id: str = "default",
        direction: str = "entry",
        request_id: Optional[str] = None,
    ):
        """Capture a vehicle frame and run ONLY the vehicle sub-stages
        (plate detection + OCR + vehicle fingerprint) to build a pending-vehicle
        record. Face recognition and any finalize effects are intentionally
        skipped - the driver's face is captured separately on the operator phone.

        Returns a tuple (frame, PipelineResult) so the caller can persist the
        frame for the later combined identity pass.
        """
        context = PipelineContext(
            camera_id=camera_id,
            direction=direction,
            require_face=False,
            finalize=False,
        )
        if request_id:
            context.request_id = request_id
        context.add_timestamp("pipeline_start")

        await self._capture_frame(context)
        frame = context.frame

        stages = [self._detect_plates, self._crop_plates, self._recognize_plates]
        if self.services.vehicle_fingerprint_service is not None:
            stages.append(self._process_vehicle_fingerprint)
        workflow = WorkflowEngine(stages)
        stage_results = await workflow.execute(context)

        result = PipelineResult(
            success=all(r.success for r in stage_results) if stage_results else False,
            request_id=context.request_id,
            total_processing_time=0.0,
            stage_results=stage_results,
            detected_plates=self._build_detected_plates(context),
            recognized_plates=self._build_recognized_plates(context),
            warnings=context.warnings,
            errors=context.errors,
            vehicle_fingerprints=self._build_vehicle_fingerprints(context),
        )
        return frame, result

    async def pending_from_frame(
        self,
        frame_data: bytes,
        direction: str = "entry",
        request_id: Optional[str] = None,
    ):
        """Run ONLY the vehicle sub-stages (plate detection + OCR + vehicle
        fingerprint) against a caller-supplied frame and return the frame plus a
        PipelineResult for building a pending-vehicle record.

        Used by the hybrid two-camera flow so that ANY device (system USB camera
        or operator phone browser camera) can hand its vehicle capture off to
        the other device for the face scan. Face recognition and any finalize
        effects are intentionally skipped.
        """
        context = PipelineContext(
            camera_id=None,
            direction=direction,
            require_face=False,
            finalize=False,
        )
        if request_id:
            context.request_id = request_id
        context.add_timestamp("pipeline_start")

        frame = FrameProcessor.read_bytes(frame_data)
        if frame is None:
            raise ContextValidationError("Failed to decode uploaded vehicle frame")
        context.frame = frame
        context.frame_metadata = {
            "height": frame.shape[0],
            "width": frame.shape[1],
            "channels": frame.shape[2] if frame.ndim == 3 else 1,
        }

        stages = [self._detect_plates, self._crop_plates, self._recognize_plates]
        if self.services.vehicle_fingerprint_service is not None:
            stages.append(self._process_vehicle_fingerprint)
        workflow = WorkflowEngine(stages)
        stage_results = await workflow.execute(context)

        result = PipelineResult(
            success=all(r.success for r in stage_results) if stage_results else False,
            request_id=context.request_id,
            total_processing_time=0.0,
            stage_results=stage_results,
            detected_plates=self._build_detected_plates(context),
            recognized_plates=self._build_recognized_plates(context),
            warnings=context.warnings,
            errors=context.errors,
            vehicle_fingerprints=self._build_vehicle_fingerprints(context),
        )
        return frame, result

    async def execute(
        self, context: PipelineContext,
    ) -> PipelineResult:
        return await self._execute(context)

    async def _execute(self, context: PipelineContext) -> PipelineResult:
        request_id = context.request_id
        stage_names = [s.__name__ for s in self._build_stages()]
        self.logger.pipeline_started(request_id, stage_names)

        start_total = time.perf_counter()
        start_iso = datetime.now(timezone.utc).isoformat()

        try:
            stage_results = await self._workflow.execute(context)
        except Exception as e:
            self.logger.pipeline_completed(request_id, False, 0.0)
            self._log_summary(
                request_id, start_iso, 0.0, {}, None,
                errors=[str(e)],
            )
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

        self._log_summary(
            request_id,
            start_iso,
            total_time,
            context.processing_times,
            decision,
            errors=context.errors,
            recognized_plates=recognized,
        )

        return result

    def _log_summary(
        self,
        request_id: str,
        start_iso: str,
        total_ms: float,
        stage_times: dict,
        decision: Optional[dict],
        errors: Optional[list] = None,
        recognized_plates: Optional[list] = None,
    ) -> None:
        end_iso = datetime.now(timezone.utc).isoformat()
        stage_summary = {k: round(v, 2) for k, v in (stage_times or {}).items()}
        logger.info(
            "Pipeline summary: total=%.2fms stages=%s decision=%s recognized=%d errors=%d",
            total_ms,
            stage_summary,
            (decision or {}).get("decision", "NONE"),
            len(recognized_plates or []),
            len(errors or []),
            extra={
                "request_id": request_id,
                "event": "pipeline_summary",
                "start_time": start_iso,
                "end_time": end_iso,
                "total_duration_ms": round(total_ms, 2),
                "stage_times_ms": stage_summary,
                "decision": (decision or {}).get("decision", "NONE"),
                "recognized_plate_count": len(recognized_plates or []),
                "error_count": len(errors or []),
            },
        )

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
        detections = []
        for d in result.get("detections", []):
            if hasattr(d, "model_dump"):
                detections.append(d.model_dump())
            elif isinstance(d, dict):
                detections.append(d)
        context.detections = detections

    async def _crop_plates(self, context: PipelineContext) -> None:
        if context.frame is None:
            return

        frame_h, frame_w = context.frame.shape[:2]
        frame_area = frame_h * frame_w
        min_aspect = settings.PLATE_MIN_ASPECT_RATIO
        max_aspect = settings.PLATE_MAX_ASPECT_RATIO
        max_area_fraction = settings.OCR_MAX_CROP_AREA_FRACTION
        cropped = []
        for idx, det in enumerate(context.detections):
            bbox = det.get("bbox")
            if not bbox:
                continue
            if len(bbox) == 4:
                x1, y1, x2, y2 = bbox
            elif len(bbox) == 8:
                x_coords = [bbox[i] for i in range(0, 8, 2)]
                y_coords = [bbox[i] for i in range(1, 8, 2)]
                x1, y1 = min(x_coords), min(y_coords)
                x2, y2 = max(x_coords), max(y_coords)
            else:
                continue
            x1 = max(0, int(x1))
            y1 = max(0, int(y1))
            x2 = min(frame_w, int(x2))
            y2 = min(frame_h, int(y2))
            if x2 <= x1 or y2 <= y1:
                continue
            w = x2 - x1
            h = y2 - y1
            aspect = w / h
            area_fraction = (w * h) / frame_area if frame_area else 0
            reason = None
            if min_aspect and aspect < min_aspect:
                reason = (
                    f"crop aspect {aspect:.2f} < PLATE_MIN_ASPECT_RATIO "
                    f"({min_aspect:.2f})"
                )
            elif max_aspect and aspect > max_aspect:
                reason = (
                    f"crop aspect {aspect:.2f} > PLATE_MAX_ASPECT_RATIO "
                    f"({max_aspect:.2f})"
                )
            elif max_area_fraction and area_fraction > max_area_fraction:
                reason = (
                    f"crop area {w * h} is {area_fraction:.2f}x frame area, "
                    f"> OCR_MAX_CROP_AREA_FRACTION ({max_area_fraction:.2f})"
                )
            if reason is not None:
                logger.info(
                    "Plate crop skipped: %s request_id=%s | event=plate_crop_skipped "
                    "| detection_index=%s | bbox=%s | reason=%s",
                    context.request_id, context.request_id,
                    idx, bbox, reason,
                )
                continue
            crop = context.frame[y1:y2, x1:x2].copy()
            cropped.append({
                "image": crop,
                "bbox": bbox,
                "confidence": det.get("confidence", 0.0),
                "cropped_plate_path": det.get("cropped_plate_path", ""),
                "original_index": idx,
            })
        context.cropped_plates = cropped

    async def _recognize_plates(self, context: PipelineContext) -> None:
        crops = context.cropped_plates
        if not crops:
            return

        frame_area = 0
        if context.frame is not None:
            frame_area = context.frame.shape[0] * context.frame.shape[1]

        # Drop implausible detections first: low confidence and oversized boxes.
        min_conf = settings.OCR_MIN_CROP_CONFIDENCE
        max_area_fraction = settings.OCR_MAX_CROP_AREA_FRACTION
        filtered = []
        for crop in crops:
            reason = None
            conf = crop.get("confidence", 0.0)
            if min_conf and conf < min_conf:
                reason = (
                    f"confidence {conf:.3f} < OCR_MIN_CROP_CONFIDENCE "
                    f"({min_conf:.2f})"
                )
            if reason is None and frame_area and max_area_fraction:
                bbox = crop.get("bbox")
                if bbox:
                    xs = [bbox[i] for i in range(0, len(bbox) - 1, 2)]
                    ys = [bbox[i] for i in range(1, len(bbox), 2)]
                    if xs and ys:
                        w = max(xs) - min(xs)
                        h = max(ys) - min(ys)
                        frac = (w * h) / frame_area
                        if frac > max_area_fraction:
                            reason = (
                                f"crop area {w * h} is {frac:.2f}x frame area, "
                                f"> OCR_MAX_CROP_AREA_FRACTION ({max_area_fraction:.2f})"
                            )
            if reason is not None:
                logger.info(
                    "OCR crop skipped: %s request_id=%s | event=ocr_crop_skipped "
                    "| crop_index=%s | bbox=%s | reason=%s",
                    context.request_id, context.request_id,
                    crop.get("original_index", -1), crop.get("bbox"), reason,
                )
                continue
            filtered.append(crop)
        crops = filtered
        if not crops:
            return

        # Process only the highest-confidence crops to keep CPU OCR fast.
        max_crops = settings.OCR_MAX_CROPS
        if max_crops and len(crops) > max_crops:
            ranked = sorted(
                crops,
                key=lambda c: c.get("confidence", 0.0),
                reverse=True,
            )
            kept = set(id(c) for c in ranked[:max_crops])
            crops = [c for c in crops if id(c) in kept]

        images = [crop["image"] for crop in crops]
        try:
            responses = await self.services.ocr_service.read_many(images)
            for i, resp in enumerate(responses):
                resp["plate_index"] = crops[i].get("original_index", i)
                crop = crops[i]
                img = crop.get("image")
                logger.info(
                    "OCR result: %s request_id=%s | event=ocr_crop_result "
                    "| crop_index=%s | crop_size=%sx%s | detector_conf=%.3f "
                    "| text=%r | ocr_conf=%.3f | validation=%s",
                    context.request_id, context.request_id,
                    resp["plate_index"],
                    img.shape[1] if img is not None else "?",
                    img.shape[0] if img is not None else "?",
                    crop.get("confidence", 0.0),
                    resp.get("raw_text") or resp.get("cleaned_text"),
                    resp.get("confidence", 0.0),
                    resp.get("validation_status", "n/a"),
                )
            context.ocr_results = responses
        except Exception as e:
            logger.warning(
                "OCR batch failed: %s request_id=%s | event=ocr_batch_failed "
                "| crops=%s | error=%r",
                context.request_id, context.request_id, len(images), e,
            )
            context.add_warning("recognize_plates", str(e))

    async def _recognize_faces(self, context: PipelineContext) -> None:
        frame = context.face_frame if context.face_frame is not None else context.frame
        if frame is None:
            return

        svc = self.services.face_recognition_service
        if svc is None:
            return

        if not svc.is_available():
            message = (
                f"InsightFace model '{settings.FACE_MODEL_NAME}' not downloaded; "
                "face stage unavailable"
            )
            logger.warning(
                "%s request_id=%s | event=face_model_unavailable | detail=%s",
                context.request_id, context.request_id, message,
            )
            context.add_warning("face_recognition", message)
            return

        try:
            result = await svc.recognize_from_image(frame)
            dets = result.get("detections", [])
            context.face_detections = dets
            context.face_embeddings = [
                d.get("embedding", [])
                for d in dets
                if d.get("embedding")
            ]

            match = await self._match_face_to_gallery(context)
            context.face_recognition_results = [{
                "face_detected": result.get("face_detected", False),
                "face_count": result.get("face_count", 0),
                "similarity_score": match["similarity_score"],
                "matched": match["matched"],
                "matched_driver_id": match["matched_driver_id"],
                "matched_driver_name": match["matched_driver_name"],
                "embedding_distance": match["embedding_distance"],
                "detections": dets,
            }]
        except Exception as e:
            context.add_warning("face_recognition", str(e))

    async def _match_face_to_gallery(self, context: PipelineContext) -> dict:
        """Compare captured face embeddings against enrolled active drivers.

        Returns the best match above the configured similarity threshold, or
        an empty match when the gallery is unavailable (Mongo down) or empty.
        """
        no_match = {
            "similarity_score": None,
            "matched": False,
            "matched_driver_id": None,
            "matched_driver_name": None,
            "embedding_distance": None,
        }
        embeddings = context.face_embeddings
        if not embeddings:
            return no_match

        similarity = SimilarityEngine(
            threshold=settings.FACE_SIMILARITY_THRESHOLD
        )

        try:
            gallery = [
                d for d in await DriverProfileRepository.find_active()
                if d.face_embedding_reference
            ]
        except Exception as e:
            logger.warning(
                "%s request_id=%s | event=face_gallery_unavailable | detail=%s",
                context.request_id, context.request_id, e,
            )
            context.add_warning(
                "face_recognition",
                f"Face gallery unavailable: {e}",
            )
            return no_match

        if not gallery:
            return no_match

        best = dict(no_match)
        for embedding in embeddings:
            for driver in gallery:
                score = similarity.cosine_similarity(
                    embedding, driver.face_embedding_reference
                )
                if best["similarity_score"] is None or score > best["similarity_score"]:
                    best["similarity_score"] = round(score, 4)
                    best["matched"] = similarity.is_match(score)
                    best["matched_driver_id"] = driver.driver_id
                    best["matched_driver_name"] = driver.full_name
                    best["embedding_distance"] = round(
                        1.0 - score, 4
                    )

        if best["matched"]:
            logger.info(
                "%s request_id=%s | event=face_matched | driver=%s | "
                "similarity=%s | threshold=%s",
                context.request_id, context.request_id,
                best["matched_driver_id"], best["similarity_score"],
                similarity.threshold,
            )
        return best

    async def _process_vehicle_fingerprint(self, context: PipelineContext) -> None:
        if context.frame is None:
            return

        svc = self.services.vehicle_fingerprint_service
        if svc is None:
            return

        if not svc.is_available():
            message = (
                f"ResNet50 ImageNet weights not cached; "
                "vehicle fingerprint stage unavailable"
            )
            logger.warning(
                "%s request_id=%s | event=vehicle_model_unavailable | detail=%s",
                context.request_id, context.request_id, message,
            )
            context.add_warning("vehicle_fingerprint", message)
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
            output = await engine.evaluate_result(
                stub_result,
                require_face=context.require_face,
            )
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

    async def _persist_decision(self, context: PipelineContext) -> None:
        if not context.finalize:
            return
        decision = context.decision
        if not decision:
            return
        try:
            record = DecisionRecord(
                request_id=context.request_id or "pipeline",
                direction=context.direction,
                overall_confidence=decision.get("overall_confidence", 0.0),
                decision=decision.get("decision", "MANUAL_REVIEW"),
                explanation=decision.get("explanation", ""),
                evidence=decision.get("evidence", []) or [],
                fusion_breakdown=decision.get("fusion_breakdown", {}) or {},
                triggered_rules=decision.get("triggered_rules", []) or [],
                processing_time=decision.get("processing_time", 0.0),
            )
            await DecisionRepository.create(record)
        except Exception as e:
            context.add_warning("decision_persist", str(e))

        if decision.get("decision") == "MANUAL_REVIEW":
            try:
                plate = ""
                recognized = self._build_recognized_plates(context)
                if recognized:
                    plate = max(
                        recognized,
                        key=lambda r: r.get("confidence", 0),
                    ).get("plate", "")
                review = await ManualReviewService().create_review(
                    request_id=context.request_id or "pipeline",
                    vehicle_id=plate or context.request_id or "vehicle",
                    notes=decision.get("explanation", "") or None,
                )
                logger.info(
                    "Manual review queued | review=%s vehicle=%s request_id=%s",
                    getattr(review, "review_id", "?"), plate, context.request_id,
                )
            except Exception as e:
                context.add_warning("manual_review_queue", str(e))

    async def _process_gate_workflow(self, context: PipelineContext) -> None:
        if not context.finalize:
            return
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
                "action": context.direction.upper(),
                "message": f"Decision is '{decision_value}', not GRANT",
            }
            return
        recognized = self._build_recognized_plates(context)
        if not recognized:
            context.gate_workflow_result = {
                "success": False,
                "action": context.direction.upper(),
                "message": "No plate recognized",
            }
            return
        plate_text = recognized[0].get("plate", "")
        if not plate_text:
            context.gate_workflow_result = {
                "success": False,
                "action": context.direction.upper(),
                "message": "Empty plate text",
            }
            return

        face_embedding = context.face_embeddings[0] if context.face_embeddings else None
        vehicle_embedding = (
            context.vehicle_embeddings[0]
            if context.vehicle_embeddings else None
        )

        try:
            if settings.DECISION_MODE == "session":
                if context.direction == "exit":
                    result = await svc.run_session_exit(
                        plate_text=plate_text,
                        request_id=context.request_id,
                        face_embedding=face_embedding,
                        vehicle_embedding=vehicle_embedding,
                        decision=decision_value,
                    )
                else:
                    result = await svc.run_session_entry(
                        plate_text=plate_text,
                        request_id=context.request_id,
                        face_embedding=face_embedding,
                        vehicle_embedding=vehicle_embedding,
                        decision=decision_value,
                        verification=(
                            decision.get("session_verification")
                            if isinstance(decision.get("session_verification"), dict)
                            else None
                        ),
                    )
            else:
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
            if not result.success:
                await self._deny_on_gate_rejection(
                    context, result.error or result.message or ""
                )
        except Exception as e:
            context.gate_workflow_result = {
                "success": False,
                "action": context.direction.upper(),
                "message": f"Gate workflow error: {e}",
                "error": str(e),
            }

    async def _deny_on_gate_rejection(
        self, context: PipelineContext, reason: str
    ) -> None:
        """The gate is authoritative: when it rejects a GRANT (e.g. exit face
        mismatch, duplicate entry), record the outcome as DENY so history and
        the API response reflect reality instead of the engine's provisional
        GRANT."""
        if not context.decision:
            return
        context.decision["decision"] = "DENY"
        explanation = context.decision.get("explanation") or ""
        if reason:
            explanation = f"{explanation} Gate: {reason}".strip()
        context.decision["explanation"] = explanation
        if not context.request_id:
            return
        try:
            await DecisionRepository.update_decision(
                context.request_id, "DENY", explanation
            )
        except Exception as e:
            context.add_warning("decision_override", str(e))

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
                "matched_driver_id": r.get("matched_driver_id"),
                "matched_driver_name": r.get("matched_driver_name"),
                "embedding_distance": r.get("embedding_distance"),
                "detections": r.get("detections", []),
            }
            for r in context.face_recognition_results
        ]

    def _build_recognized_plates(self, context: PipelineContext) -> list:
        detections = context.detections or []
        plates = []
        for r in context.ocr_results:
            if not (r.get("raw_text") or r.get("cleaned_text")):
                continue
            plate_index = r.get("plate_index")
            det = {}
            if isinstance(plate_index, int) and 0 <= plate_index < len(detections):
                det = detections[plate_index] or {}
            plates.append({
                "plate": r.get("cleaned_text", r.get("raw_text", "")),
                "confidence": r.get("confidence", 0.0),
                "validation_status": r.get("validation_status", "unchecked"),
                "bbox": list(det.get("bbox", []) or []),
                "detection_confidence": det.get("confidence", 0.0),
            })
        # Present validated plates first so downstream consumers (gate workflow,
        # decision engine) prefer a real plate over a spurious high-confidence
        # read (e.g. a school name painted on a bus).
        plates.sort(
            key=lambda p: (
                p.get("validation_status") != "valid",
                -float(p.get("confidence", 0.0)),
            )
        )
        return plates
