import threading
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

from app.services.ai.plate_detection.model_loader import ModelLoader, ModelLoadError


def test_singleton_pattern():
    loader1 = ModelLoader()
    loader2 = ModelLoader()
    assert loader1 is loader2


def test_singleton_thread_safety():
    loaders = []
    errors = []

    def _create():
        try:
            loaders.append(ModelLoader())
        except Exception as e:
            errors.append(e)

    threads = [threading.Thread(target=_create) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(errors) == 0
    assert all(l is loaders[0] for l in loaders)


def test_initial_state():
    loader = ModelLoader()
    assert loader.is_loaded() is False
    meta = loader.get_metadata()
    assert meta["loaded"] is False
    assert meta["device"] == "cpu"


@patch("app.services.ai.plate_detection.model_loader.settings")
def test_load_model_not_found(mock_settings):
    mock_settings.YOLO_MODEL_PATH = "nonexistent/path.pt"
    loader = ModelLoader()
    loader._initialized = False
    loader.__init__()
    with pytest.raises(ModelLoadError) as exc:
        loader.load()
    assert "not found" in str(exc.value)


@patch("app.services.ai.plate_detection.model_loader.Path.exists")
@patch("app.services.ai.plate_detection.model_loader.YOLO")
def test_load_success(mock_yolo, mock_exists):
    mock_exists.return_value = True
    mock_model = MagicMock()
    mock_yolo.return_value = mock_model

    loader = ModelLoader()
    loader._initialized = False
    loader.__init__()
    result = loader.load(model_path="models/yolov8n.pt", device="cpu")
    assert result is mock_model
    assert loader.is_loaded() is True
    assert loader._model_version is not None


@patch("app.services.ai.plate_detection.model_loader.Path.exists")
@patch("app.services.ai.plate_detection.model_loader.YOLO")
def test_load_idempotent(mock_yolo, mock_exists):
    mock_exists.return_value = True
    mock_model = MagicMock()
    mock_yolo.return_value = mock_model

    loader = ModelLoader()
    loader._initialized = False
    loader.__init__()
    loader.load(model_path="models/yolov8n.pt")
    loader.load(model_path="models/yolov8n.pt")
    assert mock_yolo.call_count == 1


@patch("app.services.ai.plate_detection.model_loader.Path.exists")
@patch("app.services.ai.plate_detection.model_loader.YOLO")
def test_load_reload_on_new_path(mock_yolo, mock_exists):
    mock_exists.return_value = True
    mock_model = MagicMock()
    mock_yolo.return_value = mock_model

    loader = ModelLoader()
    loader._initialized = False
    loader.__init__()
    loader.load(model_path="models/yolov8n.pt")
    loader.load(model_path="models/yolov8n-seg.pt")
    assert mock_yolo.call_count == 2


@patch("app.services.ai.plate_detection.model_loader.Path.exists")
@patch("app.services.ai.plate_detection.model_loader.YOLO")
def test_unload(mock_yolo, mock_exists):
    mock_exists.return_value = True
    mock_yolo.return_value = MagicMock()

    loader = ModelLoader()
    loader._initialized = False
    loader.__init__()
    loader.load(model_path="models/yolov8n.pt")
    assert loader.is_loaded() is True
    loader.unload()
    assert loader.is_loaded() is False


def test_get_model_not_loaded():
    loader = ModelLoader()
    with pytest.raises(ModelLoadError) as exc:
        loader.get_model()
    assert "not loaded" in str(exc.value)


@patch("app.services.ai.plate_detection.model_loader.Path.exists")
@patch("app.services.ai.plate_detection.model_loader.YOLO")
def test_get_model(mock_yolo, mock_exists):
    mock_exists.return_value = True
    mock_model = MagicMock()
    mock_yolo.return_value = mock_model

    loader = ModelLoader()
    loader._initialized = False
    loader.__init__()
    loader.load(model_path="models/yolov8n.pt")
    assert loader.get_model() is mock_model


@patch("app.services.ai.plate_detection.model_loader.Path.exists")
@patch("app.services.ai.plate_detection.model_loader.YOLO")
def test_health_check(mock_yolo, mock_exists):
    mock_exists.return_value = True
    mock_yolo.return_value = MagicMock()

    loader = ModelLoader()
    loader._initialized = False
    loader.__init__()
    health = loader.health_check()
    assert health["healthy"] is False

    loader.load(model_path="models/yolov8n.pt")
    health = loader.health_check()
    assert health["healthy"] is True


@patch("app.services.ai.plate_detection.model_loader.Path.exists")
@patch("app.services.ai.plate_detection.model_loader.YOLO")
def test_resolve_device_auto_no_torch(mock_yolo, mock_exists):
    mock_exists.return_value = True
    mock_yolo.return_value = MagicMock()

    loader = ModelLoader()
    loader._initialized = False
    loader.__init__()
    device = loader._resolve_device("auto")
    assert device == "cpu"


@patch("app.services.ai.plate_detection.model_loader.Path.exists")
@patch("app.services.ai.plate_detection.model_loader.YOLO")
def test_extract_version(mock_yolo, mock_exists):
    mock_exists.return_value = True
    mock_yolo.return_value = MagicMock()

    loader = ModelLoader()
    loader._initialized = False
    loader.__init__()
    version = loader._extract_version()
    assert version == "8.3.87"
