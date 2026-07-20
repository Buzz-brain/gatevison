import numpy as np
import pytest
import torch

from app.services.ai.vehicle_fingerprint.preprocessing import (
    PreprocessingError,
    VehiclePreprocessor,
)


def test_preprocess_success():
    pre = VehiclePreprocessor()
    image = np.random.randint(0, 255, (100, 200, 3), dtype=np.uint8)
    tensor = pre.preprocess(image)
    assert tensor.shape == (1, 3, 224, 224)
    assert tensor.dtype == torch.float32


def test_preprocess_empty():
    pre = VehiclePreprocessor()
    with pytest.raises(PreprocessingError):
        pre.preprocess(np.array([], dtype=np.uint8))


def test_preprocess_grayscale():
    pre = VehiclePreprocessor()
    gray = np.random.randint(0, 255, (100, 200), dtype=np.uint8)
    tensor = pre.preprocess(gray)
    assert tensor.shape == (1, 3, 224, 224)
