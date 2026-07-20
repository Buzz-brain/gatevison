import threading
from unittest.mock import patch, MagicMock

import pytest

from app.services.ai.ocr.ocr_loader import OcrLoader, OcrLoadError


@pytest.fixture(autouse=True)
def reset_ocr_loader():
    OcrLoader._instance = None


@patch("app.services.ai.ocr.ocr_loader.settings")
def test_initial_state(mock_settings):
    loader = OcrLoader()
    assert loader.is_loaded() is False
    meta = loader.get_metadata()
    assert meta["loaded"] is False


@patch("app.services.ai.ocr.ocr_loader.settings")
@patch("app.services.ai.ocr.ocr_loader.easyocr")
def test_load_success(mock_easyocr, mock_settings):
    mock_settings.OCR_LANGUAGES = "en"
    mock_settings.OCR_GPU = "false"
    mock_reader = MagicMock()
    mock_easyocr.Reader.return_value = mock_reader

    loader = OcrLoader()
    result = loader.load()
    assert result is mock_reader
    assert loader.is_loaded() is True


@patch("app.services.ai.ocr.ocr_loader.settings")
@patch("app.services.ai.ocr.ocr_loader.easyocr")
def test_load_idempotent(mock_easyocr, mock_settings):
    mock_settings.OCR_LANGUAGES = "en"
    mock_settings.OCR_GPU = "false"
    mock_reader = MagicMock()
    mock_easyocr.Reader.return_value = mock_reader

    loader = OcrLoader()
    loader.load()
    loader.load()
    assert mock_easyocr.Reader.call_count == 1


@patch("app.services.ai.ocr.ocr_loader.settings")
@patch("app.services.ai.ocr.ocr_loader.easyocr")
def test_unload(mock_easyocr, mock_settings):
    mock_settings.OCR_LANGUAGES = "en"
    mock_settings.OCR_GPU = "false"
    mock_easyocr.Reader.return_value = MagicMock()

    loader = OcrLoader()
    loader.load()
    assert loader.is_loaded() is True
    loader.unload()
    assert loader.is_loaded() is False


@patch("app.services.ai.ocr.ocr_loader.settings")
def test_get_reader_not_loaded(mock_settings):
    loader = OcrLoader()
    with pytest.raises(OcrLoadError):
        loader.get_reader()


@patch("app.services.ai.ocr.ocr_loader.settings")
@patch("app.services.ai.ocr.ocr_loader.easyocr")
def test_get_reader(mock_easyocr, mock_settings):
    mock_settings.OCR_LANGUAGES = "en"
    mock_settings.OCR_GPU = "false"
    mock_reader = MagicMock()
    mock_easyocr.Reader.return_value = mock_reader

    loader = OcrLoader()
    loader.load()
    assert loader.get_reader() is mock_reader


@patch("app.services.ai.ocr.ocr_loader.settings")
@patch("app.services.ai.ocr.ocr_loader.easyocr")
def test_load_failure(mock_easyocr, mock_settings):
    mock_settings.OCR_LANGUAGES = "en"
    mock_settings.OCR_GPU = "false"
    mock_easyocr.Reader.side_effect = Exception("Download failed")

    loader = OcrLoader()
    with pytest.raises(OcrLoadError):
        loader.load()
    assert loader.is_loaded() is False


@patch("app.services.ai.ocr.ocr_loader.settings")
def test_resolve_gpu_false(mock_settings):
    mock_settings.OCR_GPU = "false"
    loader = OcrLoader()
    assert loader._resolve_gpu() is False


@patch("app.services.ai.ocr.ocr_loader.settings")
def test_resolve_gpu_true(mock_settings):
    mock_settings.OCR_GPU = "true"
    loader = OcrLoader()
    assert loader._resolve_gpu() is True


@patch("app.services.ai.ocr.ocr_loader.settings")
def test_resolve_gpu_auto_fallback(mock_settings):
    mock_settings.OCR_GPU = "auto"
    loader = OcrLoader()
    result = loader._resolve_gpu()
    assert result is False


@patch("app.services.ai.ocr.ocr_loader.settings")
def test_resolve_languages_default(mock_settings):
    mock_settings.OCR_LANGUAGES = "en"
    loader = OcrLoader()
    assert loader._resolve_languages() == ["en"]


@patch("app.services.ai.ocr.ocr_loader.settings")
def test_resolve_languages_multiple(mock_settings):
    mock_settings.OCR_LANGUAGES = "en,fr,de"
    loader = OcrLoader()
    assert loader._resolve_languages() == ["en", "fr", "de"]


@patch("app.services.ai.ocr.ocr_loader.settings")
@patch("app.services.ai.ocr.ocr_loader.easyocr")
def test_registry_integration(mock_easyocr, mock_settings):
    mock_settings.OCR_LANGUAGES = "en"
    mock_settings.OCR_GPU = "false"
    mock_easyocr.Reader.return_value = MagicMock()
    mock_easyocr.__version__ = "1.7.2"

    loader = OcrLoader()
    loader.load()
    from app.services.ai.registry.model_registry import ModelRegistry
    registry = ModelRegistry()
    info = registry.get_info("easyocr")
    assert info is not None
    assert info.loaded is True
    assert info.model_type == "ocr"


@patch("app.services.ai.ocr.ocr_loader.settings")
def test_unload_clears_registry(mock_settings):
    loader = OcrLoader()
    loader.unload()
    from app.services.ai.registry.model_registry import ModelRegistry
    registry = ModelRegistry()
    info = registry.get_info("easyocr")
    assert info is None or info.loaded is False
