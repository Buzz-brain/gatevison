from unittest.mock import MagicMock, patch

import pytest

from app.services.ai.embedding.embedding_loader import (
    EmbeddingLoadError,
    EmbeddingModelLoader,
)


def test_initial_state():
    loader = EmbeddingModelLoader("test_model")
    assert loader.is_loaded is False
    assert loader.name == "test_model"


def test_load_success():
    loader = EmbeddingModelLoader("test_model")
    mock_model = MagicMock()
    result = loader.load(mock_model, metadata={"key": "val"})
    assert result is mock_model
    assert loader.is_loaded is True


def test_load_idempotent():
    loader = EmbeddingModelLoader("test_model")
    mock_model = MagicMock()
    loader.load(mock_model)
    loader.load(mock_model)
    assert loader.is_loaded is True


def test_unload():
    loader = EmbeddingModelLoader("test_model")
    loader.load(MagicMock())
    assert loader.is_loaded is True
    loader.unload()
    assert loader.is_loaded is False


def test_get_model_not_loaded():
    loader = EmbeddingModelLoader("test_model")
    with pytest.raises(EmbeddingLoadError):
        loader.get_model()


def test_get_model_loaded():
    loader = EmbeddingModelLoader("test_model")
    mock_model = MagicMock()
    loader.load(mock_model)
    assert loader.get_model() is mock_model
