from unittest.mock import patch, MagicMock, AsyncMock

import numpy as np
import pytest

from app.services.ai.ocr.ocr_service import OcrService
from app.services.ai.ocr.plate_reader import OcrReadError


@pytest.fixture
def sample_frame():
    return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


@pytest.fixture
def mock_plate_reader():
    reader = MagicMock()
    reader.extract_text.return_value = "ABC123AA"
    reader.read.return_value = [
        {
            "bbox": [10, 10, 80, 10, 80, 30, 10, 30],
            "text": "ABC123AA",
            "confidence": 0.95,
            "inference_time_ms": 45.0,
        }
    ]
    return reader


def _make_mock_result(**kwargs):
    defaults = dict(
        id="test_id", raw_text="ABC123AA", cleaned_text="ABC123AA",
        confidence=0.95, processing_time=45.0,
        validation_status="valid", validation_message="Valid format",
        plate_detection_id=None, created_at="2024-01-01T00:00:00",
    )
    defaults.update(kwargs)
    return MagicMock(**defaults)


@pytest.fixture
def mock_repository():
    repo = AsyncMock()
    repo.create_from_ocr.return_value = _make_mock_result()
    return repo


@pytest.mark.asyncio
async def test_read_from_image(mock_plate_reader, mock_repository, sample_frame):
    service = OcrService(
        plate_reader=mock_plate_reader,
        repository=mock_repository,
    )
    result = await service.read_from_image(sample_frame)
    assert result.raw_text == "ABC123AA"
    assert result.cleaned_text == "ABC123AA"
    assert result.validation_status == "valid"


@pytest.mark.asyncio
async def test_read_from_image_no_text(mock_repository):
    mock_repository.create_from_ocr.return_value = _make_mock_result(
        raw_text="", cleaned_text="", confidence=0.0, processing_time=0.0,
        validation_status="error", validation_message="No text detected",
    )
    reader = MagicMock()
    reader.extract_text.return_value = ""
    reader.read.return_value = []
    service = OcrService(plate_reader=reader, repository=mock_repository)
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    result = await service.read_from_image(frame)
    assert result.raw_text == ""
    assert result.validation_status == "error"


@pytest.mark.asyncio
async def test_read_from_image_failure(mock_repository):
    reader = MagicMock()
    reader.extract_text.side_effect = OcrReadError("OCR failed")
    service = OcrService(plate_reader=reader, repository=mock_repository)
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    result = await service.read_from_image(frame)
    assert result.validation_status == "error"


@pytest.mark.asyncio
async def test_read_from_bytes(mock_plate_reader, mock_repository):
    import cv2
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    _, data = cv2.imencode(".jpg", frame)
    service = OcrService(
        plate_reader=mock_plate_reader,
        repository=mock_repository,
    )
    result = await service.read_from_bytes(data.tobytes())
    assert result.cleaned_text == "ABC123AA"


@pytest.mark.asyncio
async def test_get_result(mock_plate_reader, mock_repository):
    mock_repository.get_by_id = AsyncMock()
    mock_repository.get_by_id.return_value = _make_mock_result(
        id="res1", raw_text="ABC123", cleaned_text="ABC123",
    )
    service = OcrService(
        plate_reader=mock_plate_reader,
        repository=mock_repository,
    )
    result = await service.get_result("res1")
    assert result is not None
    assert result.id == "res1"


@pytest.mark.asyncio
async def test_get_result_not_found(mock_plate_reader, mock_repository):
    mock_repository.get_by_id = AsyncMock()
    mock_repository.get_by_id.return_value = None
    service = OcrService(
        plate_reader=mock_plate_reader,
        repository=mock_repository,
    )
    assert await service.get_result("nonexistent") is None


@pytest.mark.asyncio
async def test_get_by_detection(mock_plate_reader, mock_repository):
    mock_repository.get_by_detection_id = AsyncMock()
    mock_repository.get_by_detection_id.return_value = _make_mock_result(
        id="r1", raw_text="ABC123", cleaned_text="ABC123",
    )
    service = OcrService(
        plate_reader=mock_plate_reader,
        repository=mock_repository,
    )
    result = await service.get_by_detection("det1")
    assert result is not None


@pytest.mark.asyncio
async def test_get_history(mock_plate_reader, mock_repository):
    mock_repository.get_recent = AsyncMock()
    mock_repository.get_recent.return_value = [
        _make_mock_result(id="r1", raw_text="ABC", cleaned_text="ABC"),
    ]
    service = OcrService(
        plate_reader=mock_plate_reader,
        repository=mock_repository,
    )
    history = await service.get_history()
    assert len(history) == 1


@pytest.mark.asyncio
async def test_search(mock_plate_reader, mock_repository):
    mock_repository.search_by_plate = AsyncMock()
    mock_repository.search_by_plate.return_value = [
        _make_mock_result(id="r1", raw_text="ABC123", cleaned_text="ABC123"),
    ]
    service = OcrService(
        plate_reader=mock_plate_reader,
        repository=mock_repository,
    )
    results = await service.search("ABC")
    assert len(results) == 1


@pytest.mark.asyncio
async def test_get_model_info(monkeypatch):
    from app.services.ai.ocr.ocr_loader import OcrLoader
    mock_loader = MagicMock()
    monkeypatch.setattr(OcrLoader, "__new__", lambda cls: mock_loader)
    mock_loader._initialized = True
    mock_loader.get_metadata.return_value = {
        "loaded": True, "languages": ["en"], "device": "cpu",
    }
    service = OcrService()
    info = await service.get_model_info()
    assert info["loaded"] is True
