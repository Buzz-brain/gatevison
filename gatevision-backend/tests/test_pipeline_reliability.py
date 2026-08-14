"""Reliability edge-case tests: the pipeline must fail gracefully, never crash.

Covers: empty image, corrupt image, no vehicle/no plate, multiple vehicles,
plate unreadable, face hidden, camera disconnected, OCR failure, and database
unavailable (persistence failures must not crash the pipeline).
"""
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.services.ai.camera.camera_service import CameraError
from app.services.ai.orchestrator.exceptions import ContextValidationError
from app.services.ai.orchestrator.orchestrator import (
    PipelineOrchestrator,
    PipelineServices,
)


@pytest.fixture
def sample_frame():
    return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


def _make_det_svc(detections=None, camera_running=True):
    svc = MagicMock()
    svc.camera_service = MagicMock()
    if camera_running:
        svc.camera_service.capture.return_value = np.random.randint(
            0, 255, (100, 100, 3), dtype=np.uint8
        )
    else:
        svc.camera_service.capture.side_effect = CameraError("Camera is not running")
    svc.detect_from_frame = AsyncMock(
        return_value={
            "detections": detections or [],
            "total_plates": len(detections or []),
        }
    )
    return svc


def _make_ocr_svc(responses=None, side_effect=None):
    svc = MagicMock()
    if side_effect is not None:
        svc.read_many = AsyncMock(side_effect=side_effect)
    else:
        svc.read_many = AsyncMock(return_value=responses or [])
    return svc


@pytest.mark.asyncio
async def test_empty_upload_rejected_gracefully(sample_frame):
    svc = _make_det_svc()
    orch = PipelineOrchestrator(services=PipelineServices(detection_service=svc))
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=None,
    ):
        with pytest.raises(ContextValidationError):
            await orch.execute_from_upload(b"")


@pytest.mark.asyncio
async def test_corrupt_upload_rejected_gracefully(sample_frame):
    svc = _make_det_svc()
    orch = PipelineOrchestrator(services=PipelineServices(detection_service=svc))
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=None,
    ):
        with pytest.raises(ContextValidationError):
            await orch.execute_from_upload(b"\x00\x01\x02not-an-image")


@pytest.mark.asyncio
async def test_no_plate_pipeline_succeeds(sample_frame):
    svc = _make_det_svc(detections=[])
    ocr = _make_ocr_svc()
    orch = PipelineOrchestrator(
        services=PipelineServices(detection_service=svc, ocr_service=ocr)
    )
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        result = await orch.execute_from_upload(b"x")
    assert result.success is True
    assert result.detected_plates == []
    assert result.recognized_plates == []
    ocr.read_many.assert_not_awaited()


@pytest.mark.asyncio
async def test_plate_unreadable_graceful(sample_frame):
    svc = _make_det_svc(
        detections=[{
            "bbox": [10, 15, 50, 30],
            "confidence": 0.95,
            "cropped_plate_path": "",
        }]
    )
    ocr = _make_ocr_svc(responses=[{
        "plate_index": 0,
        "raw_text": "",
        "cleaned_text": "",
        "confidence": 0.0,
        "validation_status": "unreadable",
        "validation_message": "No text detected in crop",
    }])
    orch = PipelineOrchestrator(
        services=PipelineServices(detection_service=svc, ocr_service=ocr)
    )
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        result = await orch.execute_from_upload(b"x")
    assert result.success is True
    assert len(result.detected_plates) == 1
    assert result.recognized_plates == []


@pytest.mark.asyncio
async def test_multiple_vehicles_all_processed(sample_frame):
    detections = [
        {"bbox": [5, 10, 40, 24], "confidence": 0.95, "cropped_plate_path": ""},
        {"bbox": [55, 52, 90, 68], "confidence": 0.90, "cropped_plate_path": ""},
    ]
    svc = _make_det_svc(detections=detections)
    ocr = _make_ocr_svc(responses=[
        {
            "plate_index": 0,
            "raw_text": "ABC123AA",
            "cleaned_text": "ABC123AA",
            "confidence": 0.92,
            "validation_status": "valid",
            "validation_message": "",
        },
        {
            "plate_index": 1,
            "raw_text": "XYZ789BB",
            "cleaned_text": "XYZ789BB",
            "confidence": 0.88,
            "validation_status": "valid",
            "validation_message": "",
        },
    ])
    orch = PipelineOrchestrator(
        services=PipelineServices(detection_service=svc, ocr_service=ocr)
    )
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        result = await orch.execute_from_upload(b"x")
    assert result.success is True
    assert len(result.detected_plates) == 2
    assert len(result.recognized_plates) == 2
    assert result.recognized_plates[0]["plate"] == "ABC123AA"
    assert result.recognized_plates[1]["plate"] == "XYZ789BB"


@pytest.mark.asyncio
async def test_giant_banner_not_ocred_as_plate(sample_frame):
    # YOLO often flags bus-side school names / banners as "plates". Such boxes
    # are oversized or near-square, so the geometry filter must drop them and
    # only the real plate should reach OCR.
    detections = [
        {"bbox": [0, 15, 100, 55], "confidence": 0.95, "cropped_plate_path": ""},
        {"bbox": [0, 60, 35, 95], "confidence": 0.90, "cropped_plate_path": ""},
        {"bbox": [40, 70, 95, 85], "confidence": 0.80, "cropped_plate_path": ""},
    ]
    svc = _make_det_svc(detections=detections)
    ocr = _make_ocr_svc(responses=[{
        "plate_index": 2,
        "raw_text": "ABC123DE",
        "cleaned_text": "ABC123DE",
        "confidence": 0.90,
        "validation_status": "valid",
        "validation_message": "",
    }])
    orch = PipelineOrchestrator(
        services=PipelineServices(detection_service=svc, ocr_service=ocr)
    )
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        result = await orch.execute_from_upload(b"x")
    assert result.success is True
    assert len(result.recognized_plates) == 1
    assert result.recognized_plates[0]["plate"] == "ABC123DE"
    called_images = ocr.read_many.await_args.args[0]
    assert len(called_images) == 1


@pytest.mark.asyncio
async def test_recognized_plates_prefer_validated(sample_frame):
    # A spurious high-confidence read (e.g. "OFLAGOS" school name) must not
    # outrank a validated plate when both are present.
    detections = [
        {"bbox": [5, 10, 40, 24], "confidence": 0.99, "cropped_plate_path": ""},
        {"bbox": [55, 52, 90, 68], "confidence": 0.80, "cropped_plate_path": ""},
    ]
    svc = _make_det_svc(detections=detections)
    ocr = _make_ocr_svc(responses=[
        {
            "plate_index": 0,
            "raw_text": "OFLAGOS",
            "cleaned_text": "OFLAGOS",
            "confidence": 0.99,
            "validation_status": "invalid",
            "validation_message": "Does not match plate format",
        },
        {
            "plate_index": 1,
            "raw_text": "ABC123DE",
            "cleaned_text": "ABC123DE",
            "confidence": 0.85,
            "validation_status": "valid",
            "validation_message": "",
        },
    ])
    orch = PipelineOrchestrator(
        services=PipelineServices(detection_service=svc, ocr_service=ocr)
    )
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        result = await orch.execute_from_upload(b"x")
    assert result.success is True
    assert len(result.recognized_plates) == 2
    assert result.recognized_plates[0]["plate"] == "ABC123DE"
    assert result.recognized_plates[1]["plate"] == "OFLAGOS"


@pytest.mark.asyncio
async def test_face_hidden_graceful(sample_frame):
    svc = _make_det_svc()
    ocr = _make_ocr_svc()
    face = MagicMock()
    face.recognize_from_image = AsyncMock(return_value={
        "face_detected": False,
        "face_count": 0,
        "detections": [],
        "matched": False,
        "similarity_score": None,
    })
    orch = PipelineOrchestrator(
        services=PipelineServices(
            detection_service=svc, ocr_service=ocr, face_recognition_service=face,
        )
    )
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        result = await orch.execute_from_upload(b"x")
    assert result.success is True
    assert result.face_detections == []
    assert len(result.face_recognitions) == 1
    assert result.face_recognitions[0]["face_detected"] is False
    face.recognize_from_image.assert_awaited_once()


@pytest.mark.asyncio
async def test_face_service_failure_graceful(sample_frame):
    svc = _make_det_svc()
    ocr = _make_ocr_svc()
    face = MagicMock()
    face.recognize_from_image = AsyncMock(
        side_effect=RuntimeError("face model crashed")
    )
    orch = PipelineOrchestrator(
        services=PipelineServices(
            detection_service=svc, ocr_service=ocr, face_recognition_service=face,
        )
    )
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        result = await orch.execute_from_upload(b"x")
    assert result.success is True
    assert any("face_recognition" in w["stage"] for w in result.warnings)


@pytest.mark.asyncio
async def test_camera_disconnected_graceful():
    svc = _make_det_svc(camera_running=False)
    orch = PipelineOrchestrator(services=PipelineServices(detection_service=svc))
    with pytest.raises(ContextValidationError):
        await orch.execute_from_camera(camera_id="nonexistent")


@pytest.mark.asyncio
async def test_ocr_read_failure_graceful(sample_frame):
    svc = _make_det_svc(
        detections=[{
            "bbox": [10, 15, 50, 30],
            "confidence": 0.95,
            "cropped_plate_path": "",
        }]
    )
    ocr = _make_ocr_svc(side_effect=RuntimeError("OCR crashed"))
    orch = PipelineOrchestrator(
        services=PipelineServices(detection_service=svc, ocr_service=ocr)
    )
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        result = await orch.execute_from_upload(b"x")
    assert result.success is True
    assert any("recognize_plates" in w["stage"] for w in result.warnings)


@pytest.mark.asyncio
async def test_detection_persistence_failure_graceful(sample_frame):
    from app.services.ai.plate_detection.detection_service import DetectionService

    detector = MagicMock()
    detector.detect_and_crop.return_value = [{
        "bbox": [1, 1, 10, 10],
        "confidence": 0.9,
        "inference_time_ms": 5,
        "cropped_plate_path": "",
    }]
    repo = MagicMock()
    repo.create_from_result = AsyncMock(
        side_effect=Exception("Mongo unavailable")
    )
    svc = DetectionService(detector=detector, repository=repo)
    out = await svc.detect_from_frame(sample_frame)
    assert out["total_plates"] == 1
    assert len(out["detections"]) == 1


@pytest.mark.asyncio
async def test_ocr_persistence_failure_graceful(sample_frame):
    from app.services.ai.ocr.ocr_service import OcrService

    reader = MagicMock()
    reader.read.return_value = [{
        "bbox": [],
        "text": "ABC123AA",
        "confidence": 0.9,
        "inference_time_ms": 5,
    }]
    repo = MagicMock()
    repo.create_from_ocr = AsyncMock(
        side_effect=Exception("Mongo unavailable")
    )
    svc = OcrService(plate_reader=reader, repository=repo)
    result = await svc.read_from_image(sample_frame)
    assert result.cleaned_text == "ABC123AA"
    assert result.validation_status in ("valid", "invalid")
