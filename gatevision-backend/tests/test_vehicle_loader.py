from unittest.mock import MagicMock, patch

import pytest
import torch

from app.services.ai.vehicle_fingerprint.vehicle_loader import (
    VehicleLoader,
    VehicleModelError,
)


@pytest.fixture(autouse=True)
def reset():
    VehicleLoader._instance = None


@patch("app.services.ai.vehicle_fingerprint.vehicle_loader.settings")
@patch("app.services.ai.vehicle_fingerprint.vehicle_loader.models.resnet50")
def test_load_success(mock_resnet50, mock_settings):
    mock_settings.VEHICLE_MODEL_NAME = "resnet50"
    mock_settings.VEHICLE_DEVICE = "cpu"

    mock_full = MagicMock()
    mock_resnet50.return_value = mock_full

    loader = VehicleLoader()
    result = loader.load()
    assert result is not None
    assert loader.is_loaded() is True


@patch("app.services.ai.vehicle_fingerprint.vehicle_loader.settings")
@patch("app.services.ai.vehicle_fingerprint.vehicle_loader.models.resnet50")
def test_load_idempotent(mock_resnet50, mock_settings):
    mock_settings.VEHICLE_MODEL_NAME = "resnet50"
    mock_settings.VEHICLE_DEVICE = "cpu"

    mock_full = MagicMock()
    mock_resnet50.return_value = mock_full

    loader = VehicleLoader()
    loader.load()
    loader.load()
    assert mock_resnet50.call_count == 1


@patch("app.services.ai.vehicle_fingerprint.vehicle_loader.settings")
@patch("app.services.ai.vehicle_fingerprint.vehicle_loader.models.resnet50")
def test_unload(mock_resnet50, mock_settings):
    mock_settings.VEHICLE_MODEL_NAME = "resnet50"
    mock_settings.VEHICLE_DEVICE = "cpu"

    mock_full = MagicMock()
    mock_resnet50.return_value = mock_full

    loader = VehicleLoader()
    loader.load()
    assert loader.is_loaded() is True
    loader.unload()
    assert loader.is_loaded() is False


@patch("app.services.ai.vehicle_fingerprint.vehicle_loader.settings")
def test_get_model_not_loaded(mock_settings):
    loader = VehicleLoader()
    with pytest.raises(VehicleModelError):
        loader.get_model()


@patch("app.services.ai.vehicle_fingerprint.vehicle_loader.settings")
@patch("app.services.ai.vehicle_fingerprint.vehicle_loader.models.resnet50")
def test_get_metadata(mock_resnet50, mock_settings):
    mock_settings.VEHICLE_MODEL_NAME = "resnet50"
    mock_settings.VEHICLE_DEVICE = "cpu"

    mock_full = MagicMock()
    mock_resnet50.return_value = mock_full

    loader = VehicleLoader()
    meta = loader.get_metadata()
    assert meta["loaded"] is False

    loader.load()
    meta = loader.get_metadata()
    assert meta["loaded"] is True
    assert meta["model_name"] == "resnet50"
    assert meta["embedding_dim"] == 2048


@patch("app.services.ai.vehicle_fingerprint.vehicle_loader.settings")
def test_singleton(mock_settings):
    v1 = VehicleLoader()
    v2 = VehicleLoader()
    assert v1 is v2
