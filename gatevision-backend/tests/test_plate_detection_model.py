from datetime import datetime, timezone
from unittest.mock import patch, MagicMock

from app.schemas.plate_detection import (
    DetectionResult,
    PlateDetectResponse,
    PlateDetectionResponse,
    ModelInfoResponse,
    DetectionHistoryResponse,
)


def test_detection_result_schema():
    result = DetectionResult(
        confidence=0.95,
        bbox=[100, 200, 300, 400],
        cropped_plate_path="uploads/plates/test.jpg",
        inference_time_ms=45.2,
    )
    assert 0.0 <= result.confidence <= 1.0
    assert len(result.bbox) == 4
    assert result.cropped_plate_path.endswith(".jpg")


def test_detection_result_confidence_bounds():
    result = DetectionResult(
        confidence=0.0,
        bbox=[0, 0, 10, 10],
        cropped_plate_path="p.jpg",
        inference_time_ms=1.0,
    )
    assert result.confidence == 0.0

    result = DetectionResult(
        confidence=1.0,
        bbox=[0, 0, 10, 10],
        cropped_plate_path="p.jpg",
        inference_time_ms=1.0,
    )
    assert result.confidence == 1.0


def test_plate_detect_response():
    detections = [
        DetectionResult(
            confidence=0.95,
            bbox=[100, 200, 300, 400],
            cropped_plate_path="p1.jpg",
            inference_time_ms=45.0,
        ),
        DetectionResult(
            confidence=0.85,
            bbox=[50, 60, 150, 200],
            cropped_plate_path="p2.jpg",
            inference_time_ms=45.0,
        ),
    ]
    resp = PlateDetectResponse(
        detections=detections,
        total_plates=2,
        inference_time_ms=90.0,
        model_version="8.3.87",
    )
    assert resp.total_plates == 2
    assert len(resp.detections) == 2
    assert resp.inference_time_ms == 90.0


@patch("app.models.plate_detection.PlateDetection.get_settings")
def test_plate_detection_response(mock_settings):
    mock_settings.return_value = MagicMock()
    now = datetime.now(timezone.utc)
    resp = PlateDetectionResponse(
        id="abc123",
        image_id="img456",
        confidence=0.95,
        bbox=[100, 200, 300, 400],
        cropped_plate_path="uploads/plates/test.jpg",
        inference_time_ms=45.2,
        model_version="8.3.87",
        created_at=now,
    )
    assert resp.id == "abc123"
    assert resp.image_id == "img456"
    assert resp.confidence == 0.95
    assert resp.created_at == now


def test_model_info_response():
    resp = ModelInfoResponse(
        loaded=True,
        model_path="models/yolov8n.pt",
        device="cpu",
        model_version="8.3.87",
    )
    assert resp.loaded is True
    assert resp.model_path == "models/yolov8n.pt"
    assert resp.device == "cpu"


def test_detection_history_response():
    resp = DetectionHistoryResponse(
        detections=[], total=0, skip=0, limit=100
    )
    assert resp.total == 0
    assert resp.skip == 0
    assert resp.limit == 100
