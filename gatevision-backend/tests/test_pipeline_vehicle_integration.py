from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.services.ai.orchestrator.orchestrator import (
    PipelineOrchestrator,
    PipelineServices,
)


@pytest.fixture
def sample_frame():
    return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


@pytest.mark.asyncio
async def test_pipeline_with_vehicle_fingerprint(sample_frame):
    mock_face_svc = MagicMock()
    mock_face_svc.recognize_from_image = AsyncMock(
        return_value={
            "face_detected": True,
            "face_count": 1,
            "detections": [{"bbox": [10, 10, 50, 50], "confidence": 0.95}],
            "similarity_score": 0.85,
            "matched": True,
        }
    )

    mock_vehicle_svc = MagicMock()
    mock_vehicle_svc.extract_fingerprint = AsyncMock(
        return_value={
            "embedding": [0.1, 0.2, 0.3],
            "dimension": 3,
            "duration_ms": 50.0,
            "detection": {"bbox": [0, 0, 100, 100], "confidence": 1.0},
            "plate_text": None,
        }
    )

    mock_det_svc = MagicMock()
    mock_det_svc.detect_from_frame = AsyncMock(
        return_value={
            "detections": [
                {
                    "bbox": [50, 50, 100, 100, 100, 50, 50, 50],
                    "confidence": 0.95,
                    "cropped_plate_path": "/tmp/plate.jpg",
                }
            ],
        }
    )

    mock_ocr_svc = MagicMock()
    mock_ocr_svc.read_from_image = AsyncMock()

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=mock_face_svc,
        vehicle_fingerprint_service=mock_vehicle_svc,
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame
    ctx.frame_metadata = {"height": 100, "width": 100, "channels": 3}

    result = await orchestrator.execute(ctx)

    assert result.success is True
    assert len(result.vehicle_detections) == 1
    assert result.vehicle_detections[0]["detected"] is True
    mock_vehicle_svc.extract_fingerprint.assert_called_once_with(sample_frame)


@pytest.mark.asyncio
async def test_pipeline_without_vehicle_fingerprint(sample_frame):
    mock_det_svc = MagicMock()
    mock_det_svc.detect_from_frame = AsyncMock(
        return_value={
            "detections": [
                {
                    "bbox": [50, 50, 100, 100, 100, 50, 50, 50],
                    "confidence": 0.95,
                    "cropped_plate_path": "",
                }
            ],
        }
    )

    mock_ocr_svc = MagicMock()
    mock_ocr_svc.read_from_image = AsyncMock()

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=None,
        vehicle_fingerprint_service=None,
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)

    assert result.success is True
    assert result.vehicle_detections == []
    assert result.vehicle_fingerprints == []


@pytest.mark.asyncio
async def test_pipeline_vehicle_fingerprint_error_handling(sample_frame):
    mock_vehicle_svc = MagicMock()
    mock_vehicle_svc.extract_fingerprint = AsyncMock(
        side_effect=Exception("Model not loaded")
    )

    mock_det_svc = MagicMock()
    mock_det_svc.detect_from_frame = AsyncMock(
        return_value={"detections": []}
    )

    mock_ocr_svc = MagicMock()
    mock_ocr_svc.read_from_image = AsyncMock()

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=None,
        vehicle_fingerprint_service=mock_vehicle_svc,
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)

    assert result.success is True
    assert len(ctx.warnings) == 1
    assert "vehicle_fingerprint" in ctx.warnings[0]["stage"]


@pytest.mark.asyncio
async def test_pipeline_builds_vehicle_detections(sample_frame):
    mock_det_svc = MagicMock()
    mock_det_svc.detect_from_frame = AsyncMock(
        return_value={"detections": []}
    )

    mock_ocr_svc = MagicMock()
    mock_ocr_svc.read_from_image = AsyncMock()

    mock_vehicle_svc = MagicMock()
    mock_vehicle_svc.extract_fingerprint = AsyncMock(
        return_value={
            "embedding": [0.5] * 2048,
            "dimension": 2048,
            "duration_ms": 30.0,
            "detection": {"bbox": [0, 0, 100, 100], "confidence": 1.0},
            "plate_text": None,
        }
    )

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=None,
        vehicle_fingerprint_service=mock_vehicle_svc,
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)

    assert result.vehicle_detections[0]["detected"] is True
    assert result.vehicle_detections[0]["embedding_count"] == 1
    assert len(result.vehicle_fingerprints) == 1
    fp = result.vehicle_fingerprints[0]
    assert fp["dimension"] == 2048
    assert fp["duration_ms"] == 30.0
