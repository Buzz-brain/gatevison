from unittest.mock import MagicMock, patch

import numpy as np
import pytest
import torch


@pytest.fixture
def sample_image():
    return np.random.randint(0, 255, (100, 200, 3), dtype=np.uint8)


@patch(
    "app.services.ai.vehicle_fingerprint.feature_extractor.VehicleLoader"
)
@patch(
    "app.services.ai.vehicle_fingerprint.feature_extractor.VehiclePreprocessor"
)
def test_extract_success(mock_prep_cls, mock_loader_cls, sample_image):
    mock_loader = MagicMock()
    mock_loader.is_loaded.return_value = True
    mock_loader.get_device.return_value = torch.device("cpu")

    mock_model = MagicMock()
    mock_features = torch.tensor([[0.1, 0.2, 0.3]], dtype=torch.float32)
    mock_model.return_value = mock_features
    mock_loader.get_model.return_value = mock_model
    mock_loader_cls.return_value = mock_loader

    mock_prep = MagicMock()
    mock_prep.preprocess.return_value = torch.randn(1, 3, 224, 224)
    mock_prep_cls.return_value = mock_prep

    from app.services.ai.vehicle_fingerprint.feature_extractor import (
        VehicleFeatureExtractor,
    )

    ext = VehicleFeatureExtractor()
    result = ext.extract(sample_image)

    assert "embedding" in result
    assert result["dimension"] == 3
    assert result["duration_ms"] >= 0


@patch(
    "app.services.ai.vehicle_fingerprint.feature_extractor.VehicleLoader"
)
@patch(
    "app.services.ai.vehicle_fingerprint.feature_extractor.VehiclePreprocessor"
)
def test_extract_auto_loads(mock_prep_cls, mock_loader_cls, sample_image):
    mock_loader = MagicMock()
    mock_loader.is_loaded.return_value = False
    mock_loader.get_device.return_value = torch.device("cpu")

    mock_model = MagicMock()
    mock_features = torch.tensor([[0.5]], dtype=torch.float32)
    mock_model.return_value = mock_features
    mock_loader.get_model.return_value = mock_model
    mock_loader_cls.return_value = mock_loader

    mock_prep = MagicMock()
    mock_prep.preprocess.return_value = torch.randn(1, 3, 224, 224)
    mock_prep_cls.return_value = mock_prep

    from app.services.ai.vehicle_fingerprint.feature_extractor import (
        VehicleFeatureExtractor,
    )

    ext = VehicleFeatureExtractor()
    result = ext.extract(sample_image)
    mock_loader.load.assert_called_once()
    assert result["dimension"] == 1


@patch(
    "app.services.ai.vehicle_fingerprint.feature_extractor.VehicleLoader"
)
@patch(
    "app.services.ai.vehicle_fingerprint.feature_extractor.VehiclePreprocessor"
)
def test_extract_batch(mock_prep_cls, mock_loader_cls):
    mock_loader = MagicMock()
    mock_loader.is_loaded.return_value = True
    mock_loader.get_device.return_value = torch.device("cpu")

    mock_model = MagicMock()
    mock_model.return_value = torch.tensor([[0.1]], dtype=torch.float32)
    mock_loader.get_model.return_value = mock_model
    mock_loader_cls.return_value = mock_loader

    mock_prep = MagicMock()
    mock_prep.preprocess.return_value = torch.randn(1, 3, 224, 224)
    mock_prep_cls.return_value = mock_prep

    from app.services.ai.vehicle_fingerprint.feature_extractor import (
        VehicleFeatureExtractor,
    )

    ext = VehicleFeatureExtractor()
    images = [
        np.random.randint(0, 255, (50, 50, 3), dtype=np.uint8),
        np.random.randint(0, 255, (60, 60, 3), dtype=np.uint8),
    ]
    results = ext.extract_batch(images)
    assert len(results) == 2
