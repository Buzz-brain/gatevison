import numpy as np

from app.services.ai.plate_detection.visualization import Visualization


def test_draw_detections_empty():
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    result = Visualization.draw_detections(frame, [])
    assert result is not None
    assert len(result) > 0


def test_draw_detections_single():
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    detections = [
        {"bbox": [100, 150, 300, 400], "confidence": 0.95}
    ]
    result = Visualization.draw_detections(frame, detections)
    assert result is not None


def test_draw_detections_multiple():
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    detections = [
        {"bbox": [10, 20, 100, 150], "confidence": 0.95},
        {"bbox": [200, 50, 400, 300], "confidence": 0.85},
    ]
    result = Visualization.draw_detections(frame, detections)
    assert result is not None


def test_draw_detections_skips_invalid_bbox():
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    detections = [
        {"bbox": [10, 20, 100, 150], "confidence": 0.95},
        {"bbox": [1, 2, 3], "confidence": 0.50},
        {"confidence": 0.30},
    ]
    result = Visualization.draw_detections(frame, detections)
    assert result is not None


def test_draw_detections_custom_color():
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    detections = [{"bbox": [10, 20, 50, 80], "confidence": 0.90}]
    result = Visualization.draw_detections(frame, detections, color=(255, 0, 0))
    assert result is not None


def test_draw_bbox_only():
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    result = Visualization.draw_bbox_only(frame, [10, 20, 50, 80])
    assert result is not None


def test_draw_bbox_only_custom_color():
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    result = Visualization.draw_bbox_only(frame, [10, 20, 50, 80], color=(0, 0, 255))
    assert result is not None
