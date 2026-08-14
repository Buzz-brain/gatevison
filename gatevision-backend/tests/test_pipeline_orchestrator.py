from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.services.ai.orchestrator.exceptions import (
    ContextValidationError,
    PipelineExecutionError,
)
from app.services.ai.orchestrator.metrics import PipelineMetrics
from app.services.ai.orchestrator.orchestrator import (
    PipelineOrchestrator,
    PipelineServices,
)
from app.services.ai.orchestrator.pipeline_context import PipelineContext


def test_default_services_include_face_and_vehicle():
    services = PipelineServices.default()
    assert services.face_recognition_service is not None
    assert services.vehicle_fingerprint_service is not None
    orchestrator = PipelineOrchestrator(services=services)
    stage_names = [s.__name__ for s in orchestrator._build_stages()]
    assert "_recognize_faces" in stage_names
    assert "_process_vehicle_fingerprint" in stage_names


@pytest.fixture
def sample_frame():
    return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


@pytest.fixture
def mock_detection_service():
    svc = MagicMock()
    svc.camera_service = MagicMock()
    svc.camera_service.capture.return_value = np.random.randint(
        0, 255, (100, 100, 3), dtype=np.uint8
    )
    svc.detect_from_frame = AsyncMock()
    svc.detect_from_frame.return_value = {
        "detections": [
            {
                "bbox": [10, 15, 50, 15, 50, 35, 10, 35],
                "confidence": 0.95,
                "cropped_plate_path": "/tmp/crop1.jpg",
                "inference_time_ms": 45.0,
            },
        ],
        "total_plates": 1,
        "inference_time_ms": 45.0,
        "model_version": "v1",
    }
    return svc


@pytest.fixture
def mock_ocr_service():
    svc = MagicMock()
    svc.read_many = AsyncMock()
    svc.read_many.return_value = [{
        "plate_index": 0,
        "raw_text": "ABC123AA",
        "cleaned_text": "ABC123AA",
        "confidence": 0.92,
        "validation_status": "valid",
        "validation_message": "Valid format",
    }]
    return svc


@pytest.fixture
def mock_services(mock_detection_service, mock_ocr_service):
    return PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
    )


@pytest.mark.asyncio
async def test_execute_from_upload_success(
    mock_services, sample_frame,
):
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        orchestrator = PipelineOrchestrator(services=mock_services)

        data = b"fake_image_bytes"
        result = await orchestrator.execute_from_upload(data)

        assert result.success is True
        assert len(result.request_id) == 12
        assert result.total_processing_time > 0
        assert len(result.detected_plates) == 1
        assert len(result.recognized_plates) == 1
        assert result.recognized_plates[0]["plate"] == "ABC123AA"
        mock_services.detection_service.detect_from_frame.assert_awaited_once()
        mock_services.ocr_service.read_many.assert_awaited_once()


@pytest.mark.asyncio
async def test_execute_from_upload_invalid_image(mock_services):
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=None,
    ):
        orchestrator = PipelineOrchestrator(services=mock_services)

        with pytest.raises(ContextValidationError):
            await orchestrator.execute_from_upload(b"bad_data")


@pytest.mark.asyncio
async def test_execute_from_camera_success(mock_services):
    orchestrator = PipelineOrchestrator(services=mock_services)

    result = await orchestrator.execute_from_camera("cam1")

    assert result.success is True
    assert len(result.detected_plates) == 1
    assert len(result.recognized_plates) == 1
    mock_services.detection_service.detect_from_frame.assert_awaited_once()


@pytest.mark.asyncio
async def test_camera_no_frame(mock_services):
    mock_services.detection_service.camera_service.capture.return_value = None
    orchestrator = PipelineOrchestrator(services=mock_services)

    with pytest.raises(ContextValidationError):
        await orchestrator.execute_from_camera("cam1")


@pytest.mark.asyncio
async def test_detection_fails_non_fatal(mock_services, sample_frame):
    mock_services.detection_service.detect_from_frame.side_effect = (
        ValueError("Detection crashed")
    )

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        orchestrator = PipelineOrchestrator(services=mock_services)
        result = await orchestrator.execute_from_upload(b"data")

        assert result.success is False
        assert len(result.warnings) >= 1


@pytest.mark.asyncio
async def test_ocr_fails_non_fatal(mock_services, sample_frame):
    mock_services.ocr_service.read_many.side_effect = (
        ValueError("OCR crashed")
    )

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        orchestrator = PipelineOrchestrator(services=mock_services)
        result = await orchestrator.execute_from_upload(b"data")

        assert len(result.detected_plates) == 1
        assert len(result.recognized_plates) == 0


@pytest.mark.asyncio
async def test_metrics_are_recorded(mock_services, sample_frame):
    metrics = PipelineMetrics()
    with patch(
        "app.services.ai.orchestrator.orchestrator.get_pipeline_metrics",
        return_value=metrics,
    ):
        with patch(
            "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
            return_value=sample_frame,
        ):
            orchestrator = PipelineOrchestrator(services=mock_services)
            await orchestrator.execute_from_upload(b"data")

            snap = metrics.snapshot()
            assert snap.total_pipelines == 1
            assert snap.stages  # stage-level metrics recorded


@pytest.mark.asyncio
async def test_partial_success_detection_ok_ocr_empty(
    mock_detection_service, sample_frame,
):
    ocr_svc = MagicMock()
    ocr_svc.read_many = AsyncMock()
    ocr_svc.read_many.return_value = [{
        "plate_index": 0,
        "raw_text": "",
        "cleaned_text": "",
        "confidence": 0.0,
        "validation_status": "error",
        "validation_message": "No text",
    }]

    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=ocr_svc,
    )

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        orchestrator = PipelineOrchestrator(services=services)
        result = await orchestrator.execute_from_upload(b"data")

        assert result.success is True
        assert len(result.detected_plates) == 1
        assert len(result.recognized_plates) == 0


@pytest.mark.asyncio
async def test_multiple_detections(mock_services, sample_frame):
    mock_services.detection_service.detect_from_frame.return_value = {
        "detections": [
            {
                "bbox": [10, 15, 50, 15, 50, 35, 10, 35],
                "confidence": 0.95,
                "cropped_plate_path": "/tmp/crop1.jpg",
                "inference_time_ms": 45.0,
            },
            {
                "bbox": [60, 65, 100, 65, 100, 85, 60, 85],
                "confidence": 0.85,
                "cropped_plate_path": "/tmp/crop2.jpg",
                "inference_time_ms": 45.0,
            },
        ],
        "total_plates": 2,
        "inference_time_ms": 45.0,
        "model_version": "v1",
    }
    mock_services.ocr_service.read_many.return_value = [
        {
            "plate_index": 0,
            "raw_text": "ABC123AA",
            "cleaned_text": "ABC123AA",
            "confidence": 0.92,
            "validation_status": "valid",
            "validation_message": "Valid format",
        },
        {
            "plate_index": 1,
            "raw_text": "XYZ789BB",
            "cleaned_text": "XYZ789BB",
            "confidence": 0.88,
            "validation_status": "valid",
            "validation_message": "Valid format",
        },
    ]

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        orchestrator = PipelineOrchestrator(services=mock_services)
        result = await orchestrator.execute_from_upload(b"data")

        assert len(result.detected_plates) == 2
        assert len(result.recognized_plates) == 2
        assert mock_services.ocr_service.read_many.await_count == 1
        called_images = mock_services.ocr_service.read_many.await_args.args[0]
        assert len(called_images) == 2


@pytest.mark.asyncio
@patch("app.services.ai.orchestrator.orchestrator.DecisionRepository.create")
async def test_persist_decision_records_decision(create_mock, mock_services):
    orchestrator = PipelineOrchestrator(services=mock_services)
    ctx = PipelineContext(request_id="req-persist", direction="entry")
    ctx.decision = {
        "decision": "GRANT",
        "overall_confidence": 0.92,
        "explanation": "All evidence passed.",
        "evidence": [{"module_name": "ocr", "confidence": 0.9}],
        "fusion_breakdown": {"ocr": {"weight": 0.3, "confidence": 0.9}},
        "triggered_rules": ["all_evidence_passed"],
        "processing_time": 12.0,
    }

    await orchestrator._persist_decision(ctx)

    create_mock.assert_awaited_once()
    record = create_mock.await_args.args[0]
    assert record.decision == "GRANT"
    assert record.request_id == "req-persist"
    assert record.overall_confidence == 0.92
    assert record.triggered_rules == ["all_evidence_passed"]
    assert ctx.warnings == []


@pytest.mark.asyncio
@patch(
    "app.services.ai.orchestrator.orchestrator.DecisionRepository.create",
    new=AsyncMock(side_effect=Exception("mongo down")),
)
async def test_persist_decision_graceful_when_create_fails(mock_services):
    orchestrator = PipelineOrchestrator(services=mock_services)
    ctx = PipelineContext(request_id="req-persist")
    ctx.decision = {
        "decision": "DENY",
        "overall_confidence": 0.1,
        "explanation": "",
        "evidence": [],
    }

    await orchestrator._persist_decision(ctx)

    assert any(w["stage"] == "decision_persist" for w in ctx.warnings)


@pytest.mark.asyncio
async def test_persist_decision_skipped_without_decision(mock_services):
    orchestrator = PipelineOrchestrator(services=mock_services)
    ctx = PipelineContext(request_id="req-none")

    with patch(
        "app.services.ai.orchestrator.orchestrator.DecisionRepository.create"
    ) as create_mock:
        await orchestrator._persist_decision(ctx)
        create_mock.assert_not_awaited()
