from unittest.mock import patch, MagicMock

import numpy as np
import pytest

from app.services.ai.ocr.ocr_loader import OcrLoadError
from app.services.ai.ocr.plate_reader import PlateReader, OcrReadError


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
def test_read_empty_frame(mock_loader_cls):
    reader = PlateReader()
    with pytest.raises(OcrReadError):
        reader.read(None)


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
def test_read_zero_size_frame(mock_loader_cls):
    reader = PlateReader()
    empty = np.array([], dtype=np.uint8).reshape(0, 0, 3)
    with pytest.raises(OcrReadError):
        reader.read(empty)


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
def test_read_no_detections(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_reader = MagicMock()
    mock_loader.get_reader.return_value = mock_reader
    mock_reader.readtext.return_value = []

    reader = PlateReader()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    results = reader.read(frame)
    assert results == []


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
def test_read_with_detections(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_reader = MagicMock()
    mock_loader.get_reader.return_value = mock_reader
    mock_reader.readtext.return_value = [
        ([[10, 10], [80, 10], [80, 30], [10, 30]], "ABC123", 0.95),
    ]

    reader = PlateReader()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    results = reader.read(frame)
    assert len(results) == 1
    assert results[0]["text"] == "ABC123"
    assert results[0]["confidence"] == 0.95
    assert len(results[0]["bbox"]) == 8


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
def test_read_sorts_by_confidence(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_reader = MagicMock()
    mock_loader.get_reader.return_value = mock_reader
    mock_reader.readtext.return_value = [
        ([[0, 0], [10, 0], [10, 10], [0, 10]], "low", 0.5),
        ([[0, 0], [10, 0], [10, 10], [0, 10]], "high", 0.95),
    ]

    reader = PlateReader()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    results = reader.read(frame)
    assert results[0]["text"] == "high"
    assert results[1]["text"] == "low"


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
def test_read_auto_loads(mock_loader_cls):
    mock_loader_instance = MagicMock()
    mock_loader_cls.return_value = mock_loader_instance

    mock_reader = MagicMock()
    mock_reader.readtext.return_value = []
    mock_loader_instance.load.return_value = mock_reader
    mock_loader_instance.get_reader.side_effect = [OcrLoadError("Not loaded"), mock_reader]

    reader = PlateReader()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    results = reader.read(frame)
    assert mock_loader_instance.load.called


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
def test_read_first(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_reader = MagicMock()
    mock_loader.get_reader.return_value = mock_reader
    mock_reader.readtext.return_value = [
        ([[0, 0], [10, 0], [10, 10], [0, 10]], "ABC123", 0.95),
    ]

    reader = PlateReader()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    result = reader.read_first(frame)
    assert result is not None
    assert result["text"] == "ABC123"


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
def test_read_first_no_results(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_reader = MagicMock()
    mock_loader.get_reader.return_value = mock_reader
    mock_reader.readtext.return_value = []

    reader = PlateReader()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    assert reader.read_first(frame) is None


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
def test_extract_text(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_reader = MagicMock()
    mock_loader.get_reader.return_value = mock_reader
    mock_reader.readtext.return_value = [
        ([[0, 0], [10, 0], [10, 10], [0, 10]], "ABC123", 0.95),
    ]

    reader = PlateReader()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    text = reader.extract_text(frame)
    assert text == "ABC123"


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
def test_extract_text_no_results(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_reader = MagicMock()
    mock_loader.get_reader.return_value = mock_reader
    mock_reader.readtext.return_value = []

    reader = PlateReader()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    assert reader.extract_text(frame) == ""


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
@patch("app.services.ai.ocr.plate_reader.FrameProcessor")
def test_read_from_bytes(mock_fp, mock_loader_cls):
    mock_fp.read_bytes.return_value = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_reader = MagicMock()
    mock_loader.get_reader.return_value = mock_reader
    mock_reader.readtext.return_value = []

    reader = PlateReader()
    results = reader.read_from_bytes(b"fake_image_data")
    assert results == []


def test_pick_best_prefers_valid_plate_over_higher_conf_text():
    results = [
        {"text": "LAGOS", "confidence": 0.97},
        {"text": "KJA 987FT", "confidence": 0.77},
    ]
    best = PlateReader.pick_best(results)
    assert best["text"] == "KJA 987FT"


def test_pick_best_falls_back_to_highest_confidence():
    results = [
        {"text": "LAGOS", "confidence": 0.97},
        {"text": "WELCOME", "confidence": 0.77},
    ]
    best = PlateReader.pick_best(results)
    assert best["text"] == "LAGOS"


def test_pick_best_returns_none_for_empty():
    assert PlateReader.pick_best([]) is None


@patch("app.services.ai.ocr.plate_reader.OcrLoader")
@patch("app.services.ai.ocr.plate_reader.FrameProcessor")
def test_read_from_bytes_invalid(mock_fp, mock_loader_cls):
    mock_fp.read_bytes.return_value = None

    reader = PlateReader()
    with pytest.raises(OcrReadError):
        reader.read_from_bytes(b"bad_data")
