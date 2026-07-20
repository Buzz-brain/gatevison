from unittest.mock import patch, MagicMock, AsyncMock

import numpy as np
import pytest

from app.services.ai.plate_detection.detection_service import DetectionService


@pytest.fixture
def sample_frame():
    return np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)


@pytest.fixture
def mock_detector():
    det = MagicMock()
    det.detect_and_crop.return_value = [
        {
            "confidence": 0.95,
            "bbox": [100, 150, 300, 400],
            "inference_time_ms": 45.0,
            "cropped_plate_path": "uploads/plates/test.jpg",
        }
    ]
    return det


@pytest.fixture
def mock_repository():
    repo = AsyncMock()
    repo.create_from_result.return_value = MagicMock(
        id="det123",
        image_id="img456",
        confidence=0.95,
        bbox=[100, 150, 300, 400],
        cropped_plate_path="uploads/plates/test.jpg",
        inference_time_ms=45.0,
        model_version="8.3.87",
    )
    return repo


@pytest.fixture
def mock_camera_service():
    cam = MagicMock()
    cam.is_running.return_value = True
    cam.capture.return_value = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    return cam


@pytest.mark.asyncio
async def test_detect_from_frame(mock_detector, mock_repository):
    service = DetectionService(
        detector=mock_detector,
        repository=mock_repository,
    )
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    result = await service.detect_from_frame(frame, image_id="img456")
    assert result["total_plates"] == 1
    assert len(result["detections"]) == 1
    assert "annotated_image" in result
    assert result["annotated_image"] is None
    assert result["inference_time_ms"] > 0


@pytest.mark.asyncio
async def test_detect_from_frame_with_annotation(mock_detector, mock_repository):
    service = DetectionService(
        detector=mock_detector,
        repository=mock_repository,
    )
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    result = await service.detect_from_frame(frame, image_id="img456", annotate=True)
    assert result["annotated_image"] is not None


@pytest.mark.asyncio
async def test_detect_from_frame_empty(mock_repository):
    detector = MagicMock()
    detector.detect_and_crop.return_value = []
    service = DetectionService(detector=detector, repository=mock_repository)
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    result = await service.detect_from_frame(frame)
    assert result["total_plates"] == 0
    assert len(result["detections"]) == 0


@pytest.mark.asyncio
async def test_detect_from_camera(mock_detector, mock_repository, mock_camera_service):
    mock_image_service = AsyncMock()
    mock_image_service.save_from_frame.return_value = MagicMock(image_id="img789")

    service = DetectionService(
        detector=mock_detector,
        repository=mock_repository,
        camera_service=mock_camera_service,
        image_service=mock_image_service,
    )
    result = await service.detect_from_camera()
    assert result["total_plates"] == 1


@pytest.mark.asyncio
async def test_detect_from_camera_not_running(mock_detector, mock_repository):
    camera = MagicMock()
    camera.is_running.return_value = False
    service = DetectionService(
        detector=mock_detector,
        repository=mock_repository,
        camera_service=camera,
    )
    with pytest.raises(Exception):
        await service.detect_from_camera()


@pytest.mark.asyncio
async def test_detect_from_upload(mock_detector, mock_repository):
    mock_image_service = AsyncMock()
    mock_image_service.save_from_bytes.return_value = MagicMock(image_id="img_upload")

    service = DetectionService(
        detector=mock_detector,
        repository=mock_repository,
        image_service=mock_image_service,
    )
    import cv2
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    _, data = cv2.imencode(".jpg", frame)
    result = await service.detect_from_upload(data.tobytes())
    assert result["total_plates"] == 1


@pytest.mark.asyncio
async def test_get_history(mock_detector, mock_repository):
    mock_repository.get_all = AsyncMock()
    mock_repository.get_all.return_value = [
        MagicMock(
            id="det1",
            image_id="img1",
            confidence=0.95,
            bbox=[100, 150, 300, 400],
            cropped_plate_path="p1.jpg",
            inference_time_ms=45.0,
            model_version="8.3.87",
            created_at=MagicMock(isoformat=lambda: "2026-01-01"),
        )
    ]
    service = DetectionService(detector=mock_detector, repository=mock_repository)
    history = await service.get_history()
    assert len(history) == 1


@pytest.mark.asyncio
async def test_get_detection_found(mock_detector, mock_repository):
    mock_repository.get_by_id = AsyncMock()
    mock_repository.get_by_id.return_value = MagicMock(
        id="det1",
        image_id="img1",
        confidence=0.95,
        bbox=[100, 150, 300, 400],
        cropped_plate_path="p1.jpg",
        inference_time_ms=45.0,
        model_version="8.3.87",
    )
    service = DetectionService(detector=mock_detector, repository=mock_repository)
    result = await service.get_detection("det1")
    assert result is not None
    assert result.id == "det1"


@pytest.mark.asyncio
async def test_get_detection_not_found(mock_detector, mock_repository):
    mock_repository.get_by_id = AsyncMock()
    mock_repository.get_by_id.return_value = None
    service = DetectionService(detector=mock_detector, repository=mock_repository)
    result = await service.get_detection("nonexistent")
    assert result is None


@pytest.mark.asyncio
async def test_get_model_info(monkeypatch):
    from app.services.ai.plate_detection.model_loader import ModelLoader
    mock_loader = MagicMock()
    mock_loader.get_metadata.return_value = {
        "loaded": True,
        "model_path": "models/yolov8n.pt",
        "device": "cpu",
        "model_version": "8.3.87",
    }
    monkeypatch.setattr(ModelLoader, "__new__", lambda cls: mock_loader)
    mock_loader._initialized = True

    service = DetectionService()
    info = await service.get_model_info()
    assert info["loaded"] is True
