from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.services.ai.face_recognition.recognition_service import (
    FaceRecognitionService,
)
from app.services.ai.orchestrator.orchestrator import (
    PipelineOrchestrator,
    PipelineServices,
)


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
        "detections": [],
        "total_plates": 0,
        "inference_time_ms": 10.0,
        "model_version": "v1",
    }
    return svc


@pytest.fixture
def mock_ocr_service():
    svc = MagicMock()
    svc.read_from_image = AsyncMock()
    svc.read_from_image.return_value = MagicMock(
        raw_text="", cleaned_text="", confidence=0.0,
        processing_time=0.0, validation_status="error",
        validation_message="",
    )
    return svc


@pytest.fixture
def mock_face_service():
    svc = MagicMock(spec=FaceRecognitionService)
    svc.recognize_from_image = AsyncMock()
    svc.recognize_from_image.return_value = {
        "face_detected": True,
        "face_count": 1,
        "detections": [
            {
                "bbox": [10, 10, 60, 60],
                "confidence": 0.95,
                "cropped_face_path": "/tmp/face.jpg",
                "embedding": [0.1] * 512,
                "embedding_dimension": 512,
                "similarity_score": 0.92,
                "matched": True,
                "inference_time_ms": 25.0,
            }
        ],
        "similarity_score": 0.92,
        "matched": True,
        "embedding_dimension": 512,
        "inference_time_ms": 30.0,
    }
    return svc


@pytest.mark.asyncio
async def test_pipeline_with_face_recognition(
    mock_detection_service, mock_ocr_service, mock_face_service, sample_frame,
):
    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
        face_recognition_service=mock_face_service,
    )

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        orchestrator = PipelineOrchestrator(services=services)
        result = await orchestrator.execute_from_upload(b"data")

        assert result.success is True
        assert len(result.face_detections) == 1
        assert len(result.face_recognitions) == 1
        assert result.face_recognitions[0]["matched"] is False
        mock_face_service.recognize_from_image.assert_awaited_once()


@pytest.mark.asyncio
async def test_pipeline_face_gallery_match(
    mock_detection_service, mock_ocr_service, mock_face_service, sample_frame,
):
    from types import SimpleNamespace

    driver = SimpleNamespace(
        driver_id="DRV-001",
        full_name="Test Driver",
        face_embedding_reference=[0.1] * 512,
    )
    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
        face_recognition_service=mock_face_service,
    )

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ), patch(
        "app.services.ai.orchestrator.orchestrator.DriverProfileRepository.find_active",
        new_callable=AsyncMock,
        return_value=[driver],
    ):
        orchestrator = PipelineOrchestrator(services=services)
        result = await orchestrator.execute_from_upload(b"data")

        assert result.success is True
        rec = result.face_recognitions[0]
        assert rec["matched"] is True
        assert rec["matched_driver_id"] == "DRV-001"
        assert rec["matched_driver_name"] == "Test Driver"
        assert rec["similarity_score"] >= 0.99


@pytest.mark.asyncio
async def test_pipeline_without_face_recognition(
    mock_detection_service, mock_ocr_service, sample_frame,
):
    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
        face_recognition_service=None,
    )

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        orchestrator = PipelineOrchestrator(services=services)
        result = await orchestrator.execute_from_upload(b"data")

        assert result.success is True
        assert result.face_detections == []
        assert result.face_recognitions == []


@pytest.mark.asyncio
async def test_pipeline_face_failure_non_fatal(
    mock_detection_service, mock_ocr_service, mock_face_service, sample_frame,
):
    mock_face_service.recognize_from_image.side_effect = ValueError("Face crashed")

    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
        face_recognition_service=mock_face_service,
    )

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        orchestrator = PipelineOrchestrator(services=services)
        result = await orchestrator.execute_from_upload(b"data")

        assert result.face_detections == []
        assert result.face_recognitions == []


@pytest.mark.asyncio
async def test_pipeline_face_model_unavailable_skips_stage(
    mock_detection_service, mock_ocr_service, mock_face_service, sample_frame,
):
    mock_face_service.is_available.return_value = False

    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
        face_recognition_service=mock_face_service,
    )

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        orchestrator = PipelineOrchestrator(services=services)
        result = await orchestrator.execute_from_upload(b"data")

        assert result.success is True
        assert result.face_detections == []
        assert result.face_recognitions == []
        mock_face_service.recognize_from_image.assert_not_called()
        assert any(
            "face_recognition" in w["stage"] for w in result.warnings
        )


@pytest.mark.asyncio
async def test_pipeline_stages_include_face(
    mock_detection_service, mock_ocr_service, mock_face_service,
):
    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
        face_recognition_service=mock_face_service,
    )
    orchestrator = PipelineOrchestrator(services=services)
    stage_names = [s.__name__ for s in orchestrator._build_stages()]
    assert "_recognize_faces" in stage_names


@pytest.mark.asyncio
async def test_pipeline_stages_without_face(
    mock_detection_service, mock_ocr_service,
):
    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
        face_recognition_service=None,
    )
    orchestrator = PipelineOrchestrator(services=services)
    stage_names = [s.__name__ for s in orchestrator._build_stages()]
    assert "_recognize_faces" not in stage_names


@pytest.mark.asyncio
async def test_pipeline_uses_separate_face_frame(
    mock_detection_service, mock_ocr_service, mock_face_service, sample_frame,
):
    face_frame = np.random.randint(0, 255, (80, 80, 3), dtype=np.uint8)
    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
        face_recognition_service=mock_face_service,
    )

    def fake_read(data):
        return face_frame if data == b"face" else sample_frame

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        side_effect=fake_read,
    ):
        orchestrator = PipelineOrchestrator(services=services)
        result = await orchestrator.execute_from_upload(b"vehicle", face_data=b"face")

        assert result.success is True
        mock_face_service.recognize_from_image.assert_awaited_once_with(face_frame)
        assert result.face_recognitions


@pytest.mark.asyncio
async def test_pipeline_face_frame_falls_back_to_vehicle_frame(
    mock_detection_service, mock_ocr_service, mock_face_service, sample_frame,
):
    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
        face_recognition_service=mock_face_service,
    )

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=sample_frame,
    ):
        orchestrator = PipelineOrchestrator(services=services)
        result = await orchestrator.execute_from_upload(b"data")

        assert result.success is True
        mock_face_service.recognize_from_image.assert_awaited_once_with(sample_frame)


@pytest.mark.asyncio
async def test_pipeline_invalid_face_data_raises(
    mock_detection_service, mock_ocr_service, mock_face_service, sample_frame,
):
    from app.services.ai.orchestrator.exceptions import ContextValidationError

    services = PipelineServices(
        detection_service=mock_detection_service,
        ocr_service=mock_ocr_service,
        face_recognition_service=mock_face_service,
    )

    def fake_read(data):
        return None if data == b"badface" else sample_frame

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        side_effect=fake_read,
    ):
        orchestrator = PipelineOrchestrator(services=services)
        with pytest.raises(ContextValidationError):
            await orchestrator.execute_from_upload(b"vehicle", face_data=b"badface")
