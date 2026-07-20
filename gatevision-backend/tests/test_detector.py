from unittest.mock import patch, MagicMock, PropertyMock

import numpy as np
import pytest

from app.services.ai.plate_detection.detector import PlateDetector, DetectionError
from app.services.ai.plate_detection.model_loader import ModelLoadError


@pytest.fixture
def sample_frame():
    return np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)


@pytest.fixture
def mock_model():
    model = MagicMock()
    detection_box = MagicMock()
    detection_box.xyxy = [MagicMock()]
    detection_box.xyxy[0].tolist.return_value = [100.0, 150.0, 300.0, 400.0]
    detection_box.conf = [PropertyMock()]
    type(detection_box.conf[0]).tolist = PropertyMock(return_value=[0.95])
    detection_box.conf[0].tolist.return_value = [0.95]

    class FakeBoxes:
        def __init__(self):
            self.boxes = [detection_box]

    result = MagicMock()
    result.boxes = [detection_box]
    model.return_value = [result]

    return model


def test_detect_empty_frame():
    detector = PlateDetector()
    with pytest.raises(DetectionError):
        detector.detect(None)


def test_detect_zero_size_frame():
    detector = PlateDetector()
    empty = np.array([], dtype=np.uint8).reshape(0, 0, 3)
    with pytest.raises(DetectionError):
        detector.detect(empty)


@patch("app.services.ai.plate_detection.detector.ModelLoader")
def test_detect_no_detections(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_model = MagicMock()
    mock_loader.get_model.return_value = mock_model

    result = MagicMock()
    result.boxes = []
    mock_model.return_value = [result]

    detector = PlateDetector()
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    detections = detector.detect(frame)
    assert detections == []


@patch("app.services.ai.plate_detection.detector.ModelLoader")
def test_detect_and_crop(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_model = MagicMock()
    mock_loader.get_model.return_value = mock_model

    detection_box = MagicMock()
    detection_box.xyxy = [MagicMock()]
    detection_box.xyxy[0].tolist.return_value = [100.0, 150.0, 300.0, 400.0]
    conf_prop = PropertyMock(return_value=0.95)
    type(detection_box.conf[0]).item = MagicMock(return_value=0.95)
    detection_box.conf = [MagicMock()]
    detection_box.conf[0].item.return_value = 0.95

    result = MagicMock()
    result.boxes = [detection_box]
    mock_model.return_value = [result]

    with patch.object(PlateDetector, "_crop_plate") as mock_crop:
        mock_crop.return_value = np.random.randint(0, 255, (50, 200, 3), dtype=np.uint8)
        detector = PlateDetector()
        frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

        with patch.object(detector.storage_service, "save") as mock_save:
            mock_save.return_value = {"filepath": "uploads/plates/test.jpg"}
            detections = detector.detect_and_crop(frame)

            assert len(detections) == 1
            assert detections[0]["confidence"] <= 1.0
            assert "cropped_plate_path" in detections[0]


def test_crop_plate_invalid_bbox():
    detector = PlateDetector()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)

    crop = detector._crop_plate(frame, [50, 50, 40, 60])
    assert crop is None

    crop = detector._crop_plate(frame, [50, 50, 60, 40])
    assert crop is None


def test_crop_plate_clamps_coordinates():
    detector = PlateDetector()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)

    crop = detector._crop_plate(frame, [-10, -20, 200, 150])
    assert crop is not None
    assert crop.shape[0] == 100
    assert crop.shape[1] == 100


@patch("app.services.ai.plate_detection.detector.ModelLoader")
def test_detect_auto_loads_model(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_model = MagicMock()
    mock_model.return_value = [MagicMock(boxes=[])]
    mock_loader.get_model.side_effect = [ModelLoadError("Not loaded"), mock_model]
    mock_loader.load.return_value = mock_model

    detector = PlateDetector()
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    detections = detector.detect(frame)
    assert mock_loader.load.called


@patch("app.services.ai.plate_detection.detector.ModelLoader")
def test_detect_from_bytes(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_model = MagicMock()
    mock_loader.get_model.return_value = mock_model
    mock_model.return_value = [MagicMock(boxes=[])]

    import cv2
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    _, data = cv2.imencode(".jpg", frame)

    detector = PlateDetector()
    detections = detector.detect_from_bytes(data.tobytes())
    assert detections == []


def test_detect_from_bytes_invalid():
    detector = PlateDetector()
    with pytest.raises(DetectionError):
        detector.detect_from_bytes(b"not an image")
