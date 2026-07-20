import numpy as np
from app.services.ai.base_ai_service import BaseAIService


class ConcreteAIService(BaseAIService):
    async def load_model(self) -> None:
        self._model = "loaded"

    async def predict(self, frame: np.ndarray) -> dict:
        return {"prediction": "test"}


def test_base_ai_service_initial_state():
    service = ConcreteAIService()
    assert service.is_loaded() is False
    assert service._model is None


def test_ensure_loaded():
    service = ConcreteAIService()
    import asyncio
    asyncio.run(service.ensure_loaded())
    assert service.is_loaded() is True
    assert service._model == "loaded"


def test_ensure_loaded_idempotent():
    service = ConcreteAIService()
    import asyncio
    asyncio.run(service.ensure_loaded())
    asyncio.run(service.ensure_loaded())
    assert service.is_loaded() is True


def test_validate_input_valid():
    service = ConcreteAIService()
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    assert service.validate_input(frame) is True


def test_validate_input_none():
    service = ConcreteAIService()
    assert service.validate_input(None) is False


def test_validate_input_empty():
    service = ConcreteAIService()
    frame = np.array([], dtype=np.uint8)
    assert service.validate_input(frame) is False


def test_validate_input_invalid_dims():
    service = ConcreteAIService()
    frame = np.random.randint(0, 255, (100, 100, 3, 1), dtype=np.uint8)
    assert service.validate_input(frame) is False


def test_unload_model():
    service = ConcreteAIService()
    import asyncio
    asyncio.run(service.ensure_loaded())
    assert service.is_loaded() is True
    asyncio.run(service.unload_model())
    assert service.is_loaded() is False
    assert service._model is None


def test_predict():
    service = ConcreteAIService()
    import asyncio
    frame = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    result = asyncio.run(service.predict(frame))
    assert result == {"prediction": "test"}
