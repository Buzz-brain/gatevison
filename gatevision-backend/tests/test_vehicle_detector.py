import numpy as np
import pytest

from app.services.ai.vehicle_fingerprint.detector import (
    VehicleDetectionError,
    VehicleDetector,
)


def test_detect_valid_image():
    detector = VehicleDetector()
    image = np.random.randint(0, 255, (200, 300, 3), dtype=np.uint8)
    results = detector.detect(image)
    assert len(results) == 1
    assert results[0]["bbox"] == [0, 0, 300, 200]
    assert results[0]["confidence"] == 1.0


def test_detect_empty_image():
    detector = VehicleDetector()
    with pytest.raises(VehicleDetectionError):
        detector.detect(np.array([], dtype=np.uint8))
