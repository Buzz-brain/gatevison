from unittest.mock import patch, MagicMock

import numpy as np
import pytest

from app.services.ai.face_recognition.embedding_service import (
    EmbeddingExtractionError,
    EmbeddingService,
)


def _make_mock_face(embedding=None):
    face = MagicMock()
    face.embedding = np.array(embedding or [0.1] * 512, dtype=np.float32)
    face.det_score = 0.95
    return face


@patch("app.services.ai.face_recognition.embedding_service.FaceLoader")
def test_extract_empty_image(mock_loader_cls):
    svc = EmbeddingService()
    with pytest.raises(EmbeddingExtractionError):
        svc.extract(None)


@patch("app.services.ai.face_recognition.embedding_service.FaceLoader")
def test_extract_no_face(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_app = MagicMock()
    mock_loader.get_app.return_value = mock_app
    mock_app.get.return_value = []

    svc = EmbeddingService()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    with pytest.raises(EmbeddingExtractionError):
        svc.extract(frame)


@patch("app.services.ai.face_recognition.embedding_service.FaceLoader")
def test_extract_success(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_app = MagicMock()
    mock_loader.get_app.return_value = mock_app
    mock_app.get.return_value = [_make_mock_face()]

    svc = EmbeddingService()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    result = svc.extract(frame)
    assert "embedding" in result
    assert result["dimension"] == 512
    assert result["detection_confidence"] == 0.95
    assert result["inference_time_ms"] > 0


@patch("app.services.ai.face_recognition.embedding_service.FaceLoader")
def test_extract_all(mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader_cls.return_value = mock_loader
    mock_app = MagicMock()
    mock_loader.get_app.return_value = mock_app
    mock_app.get.return_value = [
        _make_mock_face(embedding=[0.1] * 512),
        _make_mock_face(embedding=[0.2] * 512),
    ]

    svc = EmbeddingService()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    results = svc.extract_all(frame)
    assert len(results) == 2


@patch("app.services.ai.face_recognition.embedding_service.FaceLoader")
def test_dimension_property(mock_loader_cls):
    svc = EmbeddingService()
    assert svc.dimension == 512
