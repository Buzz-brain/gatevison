import numpy as np
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.ai.pipeline import AIPipeline
from app.models.image import ImageCategory


@pytest.fixture
def mock_camera():
    cam = MagicMock()
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    cam.capture.return_value = frame
    cam.validate_frame.return_value = {
        "valid": True, "resolution_valid": True,
        "is_blurry": False, "laplacian_variance": 200.0,
        "width": 640, "height": 480,
    }
    return cam


@pytest.fixture
def mock_image_service():
    service = AsyncMock()
    service.save_from_frame.return_value = MagicMock(
        filename="test.jpg",
        filepath="uploads/temp/test.jpg",
        width=640, height=480, filesize=1000,
        category="temp",
        captured_at=None,
    )
    return service


def test_pipeline_capture(mock_camera, mock_image_service):
    pipeline = AIPipeline(
        camera_service=mock_camera,
        image_service=mock_image_service,
    )
    import asyncio
    result = asyncio.run(pipeline.capture())
    assert result is not None
    assert result.filename == "test.jpg"
    mock_camera.capture.assert_called_once()
    mock_image_service.save_from_frame.assert_called_once()


def test_pipeline_capture_validation_failure(mock_camera, mock_image_service):
    mock_camera.validate_frame.return_value = {
        "valid": False, "resolution_valid": False,
        "is_blurry": True,
    }
    pipeline = AIPipeline(
        camera_service=mock_camera,
        image_service=mock_image_service,
    )
    import asyncio
    result = asyncio.run(pipeline.capture())
    assert result is not None


def test_pipeline_validate_image():
    pipeline = AIPipeline()
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    import asyncio
    result = asyncio.run(pipeline.validate_image(frame))
    assert "quality" in result
    assert "blur" in result
    assert "resolution" in result
    assert "passed" in result
    assert "timestamp" in result


def test_pipeline_prepare_for_ai():
    pipeline = AIPipeline()
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    import asyncio
    result = asyncio.run(pipeline.prepare_for_ai(frame))
    assert "original_shape" in result
    assert "processed_shape" in result
    assert "normalized_shape" in result


def test_pipeline_process_entry():
    pipeline = AIPipeline()
    import asyncio
    result = asyncio.run(pipeline.process_entry())
    assert result["stage"] == "entry"
    assert result["status"] == "placeholder"
    assert "timestamp" in result


def test_pipeline_process_exit():
    pipeline = AIPipeline()
    import asyncio
    result = asyncio.run(pipeline.process_exit())
    assert result["stage"] == "exit"
    assert result["status"] == "placeholder"
    assert "timestamp" in result
