from unittest.mock import patch, MagicMock

import numpy as np
import pytest

from app.services.ai.face_recognition.detector import FaceDetector, FaceDetectionError
from app.services.ai.face_recognition.face_loader import FaceLoadError


def _make_mock_face(bbox=None, det_score=0.95, embedding=None):
    face = MagicMock()
    face.bbox = np.array(bbox or [10, 10, 60, 60])
    face.det_score = det_score
    face.kps = np.array([[15, 20], [55, 20], [35, 30], [20, 45], [50, 45]], dtype=float)
    face.embedding = np.array(embedding or [0.1] * 512)
    return face


@patch("app.services.ai.face_recognition.detector.FaceLoader")
def test_detect_empty_image(mock_loader_cls):
    detector = FaceDetector()
    with pytest.raises(FaceDetectionError):
        detector.detect(None)


@patch("app.services.ai.face_recognition.detector.FaceLoader")
def test_detect_no_faces(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_app = MagicMock()
    mock_loader.get_app.return_value = mock_app
    mock_app.get.return_value = []

    detector = FaceDetector()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    results = detector.detect(frame)
    assert results == []


@patch("app.services.ai.face_recognition.detector.FaceLoader")
def test_detect_single_face(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_app = MagicMock()
    mock_loader.get_app.return_value = mock_app
    mock_app.get.return_value = [_make_mock_face()]

    detector = FaceDetector()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    results = detector.detect(frame)
    assert len(results) == 1
    assert results[0]["confidence"] == 0.95
    assert len(results[0]["bbox"]) == 4


@patch("app.services.ai.face_recognition.detector.FaceLoader")
def test_detect_multiple_faces(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_app = MagicMock()
    mock_loader.get_app.return_value = mock_app
    mock_app.get.return_value = [
        _make_mock_face(bbox=[10, 10, 60, 60], det_score=0.95),
        _make_mock_face(bbox=[70, 70, 120, 120], det_score=0.85),
    ]

    detector = FaceDetector()
    frame = np.random.randint(0, 255, (200, 200, 3), dtype=np.uint8)
    results = detector.detect(frame)
    assert len(results) == 2


@patch("app.services.ai.face_recognition.detector.FaceLoader")
def test_detect_auto_loads(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_app = MagicMock()
    mock_loader.get_app.side_effect = [FaceLoadError("Not loaded"), mock_app]
    mock_app.get.return_value = [_make_mock_face()]

    detector = FaceDetector()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    results = detector.detect(frame)
    assert len(results) == 1
    assert mock_loader.load.called


@patch("app.services.ai.face_recognition.detector.FaceLoader")
@patch("app.services.ai.face_recognition.detector.cv2")
@patch("app.services.ai.face_recognition.detector.settings")
def test_detect_and_crop(mock_settings, mock_cv2, mock_loader_cls):
    mock_settings.UPLOAD_DIR = "uploads"
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_app = MagicMock()
    mock_loader.get_app.return_value = mock_app
    mock_app.get.return_value = [_make_mock_face()]

    detector = FaceDetector()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    results = detector.detect_and_crop(frame)
    assert len(results) == 1
    assert "cropped_face_path" in results[0]
