from unittest.mock import patch, MagicMock

import pytest

from app.services.ai.face_recognition.face_loader import FaceLoadError, FaceLoader


@pytest.fixture(autouse=True)
def reset_loader():
    FaceLoader._instance = None


@patch("app.services.ai.face_recognition.face_loader.settings")
def test_initial_state(mock_settings):
    loader = FaceLoader()
    assert loader.is_loaded() is False
    meta = loader.get_metadata()
    assert meta["loaded"] is False


@patch("app.services.ai.face_recognition.face_loader.settings")
@patch("app.services.ai.face_recognition.face_loader.FaceAnalysis")
def test_load_success(mock_fa, mock_settings):
    mock_settings.FACE_MODEL_NAME = "buffalo_l"
    mock_settings.FACE_DEVICE = "cpu"
    mock_app = MagicMock()
    mock_fa.return_value = mock_app

    loader = FaceLoader()
    result = loader.load()
    assert result is mock_app
    assert loader.is_loaded() is True


@patch("app.services.ai.face_recognition.face_loader.settings")
@patch("app.services.ai.face_recognition.face_loader.FaceAnalysis")
def test_load_idempotent(mock_fa, mock_settings):
    mock_settings.FACE_MODEL_NAME = "buffalo_l"
    mock_settings.FACE_DEVICE = "cpu"
    mock_fa.return_value = MagicMock()

    loader = FaceLoader()
    loader.load()
    loader.load()
    assert mock_fa.call_count == 1


@patch("app.services.ai.face_recognition.face_loader.settings")
@patch("app.services.ai.face_recognition.face_loader.FaceAnalysis")
def test_unload(mock_fa, mock_settings):
    mock_settings.FACE_MODEL_NAME = "buffalo_l"
    mock_settings.FACE_DEVICE = "cpu"
    mock_fa.return_value = MagicMock()

    loader = FaceLoader()
    loader.load()
    assert loader.is_loaded() is True
    loader.unload()
    assert loader.is_loaded() is False


@patch("app.services.ai.face_recognition.face_loader.settings")
def test_get_app_not_loaded(mock_settings):
    loader = FaceLoader()
    with pytest.raises(FaceLoadError):
        loader.get_app()


@patch("app.services.ai.face_recognition.face_loader.settings")
@patch("app.services.ai.face_recognition.face_loader.FaceAnalysis")
def test_load_failure(mock_fa, mock_settings):
    mock_settings.FACE_MODEL_NAME = "buffalo_l"
    mock_settings.FACE_DEVICE = "cpu"
    mock_fa.side_effect = Exception("Download failed")

    loader = FaceLoader()
    with pytest.raises(FaceLoadError):
        loader.load()
    assert loader.is_loaded() is False


@patch("app.services.ai.face_recognition.face_loader.settings")
def test_singleton(mock_settings):
    r1 = FaceLoader()
    r2 = FaceLoader()
    assert r1 is r2


@patch("app.services.ai.face_recognition.face_loader.settings")
@patch("app.services.ai.face_recognition.face_loader.FaceAnalysis")
def test_registry_integration(mock_fa, mock_settings):
    mock_settings.FACE_MODEL_NAME = "buffalo_l"
    mock_settings.FACE_DEVICE = "cpu"
    mock_fa.return_value = MagicMock()

    loader = FaceLoader()
    loader.load()

    from app.services.ai.registry.model_registry import ModelRegistry
    registry = ModelRegistry()
    info = registry.get_info("insightface")
    assert info is not None
    assert info.loaded is True
    assert info.model_type == "face_recognition"
