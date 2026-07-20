import threading
from unittest.mock import MagicMock, patch

import pytest

from app.services.ai.registry.model_info import ModelInfo
from app.services.ai.registry.model_registry import ModelRegistry, RegistryError


@pytest.fixture(autouse=True)
def reset_registry():
    ModelRegistry._instance = None


def test_singleton():
    r1 = ModelRegistry()
    r2 = ModelRegistry()
    assert r1 is r2


def test_singleton_thread_safety():
    registries = []
    errors = []

    def _create():
        try:
            registries.append(ModelRegistry())
        except Exception as e:
            errors.append(e)

    threads = [threading.Thread(target=_create) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(errors) == 0
    assert all(r is registries[0] for r in registries)


def test_initial_state():
    reg = ModelRegistry()
    assert reg.get_all_infos() == []
    summary = reg.health_summary()
    assert summary["total_models"] == 0


def test_register_and_get():
    reg = ModelRegistry()
    model = MagicMock()
    info = reg.register("test_model", model, "test_type", version="1.0", device="cpu")

    assert info.name == "test_model"
    assert info.model_type == "test_type"
    assert info.loaded is True
    assert reg.get_model("test_model") is model
    assert reg.is_loaded("test_model") is True


def test_register_overwrite_warning():
    reg = ModelRegistry()
    model1 = MagicMock()
    model2 = MagicMock()
    reg.register("dup", model1, "type_a")
    reg.register("dup", model2, "type_b")

    assert reg.get_model("dup") is model2
    assert reg.get_info("dup").model_type == "type_b"


def test_get_model_not_registered():
    reg = ModelRegistry()
    with pytest.raises(RegistryError):
        reg.get_model("nonexistent")


def test_get_info_nonexistent():
    reg = ModelRegistry()
    assert reg.get_info("nonexistent") is None


def test_unregister():
    reg = ModelRegistry()
    model = MagicMock()
    reg.register("m", model, "type")
    assert reg.is_loaded("m") is True
    result = reg.unregister("m")
    assert result is True
    assert reg.is_loaded("m") is False


def test_unregister_nonexistent():
    reg = ModelRegistry()
    assert reg.unregister("ghost") is False


def test_unload_all():
    reg = ModelRegistry()
    reg.register("a", MagicMock(), "type")
    reg.register("b", MagicMock(), "type")
    assert reg.health_summary()["loaded_models"] == 2
    count = reg.unload_all()
    assert count == 2
    assert reg.health_summary()["loaded_models"] == 0


def test_health_check():
    reg = ModelRegistry()
    reg.register("m1", MagicMock(), "obj_det", device="cpu")
    reg.register("m2", MagicMock(), "ocr", device="gpu")

    health = reg.health_check()
    assert "m1" in health
    assert "m2" in health
    assert health["m1"]["healthy"] is True
    assert health["m2"]["device"] == "gpu"


def test_health_summary():
    reg = ModelRegistry()
    reg.register("a", MagicMock(), "type")
    summary = reg.health_summary()
    assert summary["total_models"] == 1
    assert summary["loaded_models"] == 1
    assert summary["healthy"] is True


def test_health_summary_partial():
    reg = ModelRegistry()
    reg.register("a", MagicMock(), "type")
    reg.unregister("a")
    summary = reg.health_summary()
    assert summary["total_models"] == 1
    assert summary["loaded_models"] == 0
    assert summary["healthy"] is False


def test_update_info():
    reg = ModelRegistry()
    reg.register("m", MagicMock(), "type")
    reg.update_info("m", device="gpu", version="2.0")
    info = reg.get_info("m")
    assert info.device == "gpu"
    assert info.version == "2.0"


def test_get_all_infos():
    reg = ModelRegistry()
    reg.register("a", MagicMock(), "type_a")
    reg.register("b", MagicMock(), "type_b")
    infos = reg.get_all_infos()
    assert len(infos) == 2


def test_model_info_to_dict():
    info = ModelInfo(
        name="test", model_type="ocr", version="1.0",
        device="cpu", loaded=True,
    )
    d = info.to_dict()
    assert d["name"] == "test"
    assert d["loaded"] is True


def test_model_info_with_metadata():
    info = ModelInfo(
        name="m", model_type="t", metadata={"lang": "en"}
    )
    assert info.metadata["lang"] == "en"


def test_estimate_memory():
    reg = ModelRegistry()
    mem = reg._estimate_memory("hello")
    assert mem is not None


def test_estimate_memory_fails_gracefully():
    reg = ModelRegistry()
    class Broken:
        def __sizeof__(self):
            raise TypeError("boom")
    mem = reg._estimate_memory(Broken())
    assert mem is None
