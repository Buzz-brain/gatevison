from unittest.mock import patch, MagicMock

from app.services.ai.plate_detection.detection_logger import DetectionLogger


def test_detection_logger_init():
    logger = DetectionLogger()
    assert logger._logger.name == "gatevision.detection"


def _patched_dl():
    dl = DetectionLogger()
    dl._logger = MagicMock()
    return dl


def test_detection_started():
    dl = _patched_dl()
    dl.detection_started(source="camera")
    dl._logger.info.assert_called()


def test_detection_completed():
    dl = _patched_dl()
    dl.detection_completed(plate_count=3, total_time_ms=150.5)
    dl._logger.info.assert_called()


def test_plate_found():
    dl = _patched_dl()
    dl.plate_found(confidence=0.95, bbox=[100, 200, 300, 400], inference_ms=45.0)
    dl._logger.info.assert_called()


def test_model_loaded():
    dl = _patched_dl()
    dl.model_loaded(model_path="models/yolov8n.pt", device="cpu")
    dl._logger.info.assert_called()


def test_model_unloaded():
    dl = _patched_dl()
    dl.model_unloaded()
    dl._logger.info.assert_called()


def test_model_error():
    dl = _patched_dl()
    dl.model_error("Failed to load model")
    dl._logger.error.assert_called()


def test_no_plate_detected():
    dl = _patched_dl()
    dl.no_plate_detected()
    dl._logger.warning.assert_called()


def test_invalid_image():
    dl = _patched_dl()
    dl.invalid_image(reason="corrupted")
    dl._logger.warning.assert_called()


def test_crop_saved():
    dl = _patched_dl()
    dl.crop_saved(path="uploads/plates/test.jpg")
    dl._logger.info.assert_called()


def test_camera_error():
    dl = _patched_dl()
    dl.camera_error("Camera disconnected")
    dl._logger.error.assert_called()
