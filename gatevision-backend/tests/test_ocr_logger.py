from unittest.mock import MagicMock

from app.services.ai.ocr.ocr_logger import OcrLogger


def _patched_logger():
    dl = OcrLogger()
    dl._logger = MagicMock()
    return dl


def test_ocr_started():
    ol = _patched_logger()
    ol.ocr_started(source="camera")
    ol._logger.info.assert_called()


def test_ocr_completed():
    ol = _patched_logger()
    ol.ocr_completed("ABC123", 0.95, 45.0)
    ol._logger.info.assert_called()


def test_validation_result():
    ol = _patched_logger()
    ol.validation_result("valid", "OK")
    ol._logger.info.assert_called()


def test_invalid_format():
    ol = _patched_logger()
    ol.invalid_format("bad text")
    ol._logger.warning.assert_called()


def test_no_text_detected():
    ol = _patched_logger()
    ol.no_text_detected()
    ol._logger.warning.assert_called()


def test_image_error():
    ol = _patched_logger()
    ol.image_error("corrupted")
    ol._logger.error.assert_called()


def test_ocr_failure():
    ol = _patched_logger()
    ol.ocr_failure("timeout")
    ol._logger.error.assert_called()


def test_model_loaded():
    ol = _patched_logger()
    ol.model_loaded(["en"], "cpu")
    ol._logger.info.assert_called()


def test_model_unloaded():
    ol = _patched_logger()
    ol.model_unloaded()
    ol._logger.info.assert_called()
