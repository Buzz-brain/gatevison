import pytest

from app.services.decision.evidence import Evidence, SUPPORTED_MODULES


def test_evidence_creation():
    ev = Evidence(module_name="ocr", confidence=0.85, matched=True)
    assert ev.module_name == "ocr"
    assert ev.confidence == 0.85
    assert ev.matched is True


def test_evidence_defaults():
    ev = Evidence(module_name="plate_detection", confidence=0.0, matched=False)
    assert ev.score is None
    assert ev.processing_time == 0.0
    assert isinstance(ev.metadata, dict)


def test_evidence_unsupported_module():
    with pytest.raises(ValueError):
        Evidence(module_name="unknown_module", confidence=0.0, matched=False)


def test_supported_modules():
    assert "plate_detection" in SUPPORTED_MODULES
    assert "ocr" in SUPPORTED_MODULES
    assert "face_recognition" in SUPPORTED_MODULES
    assert "vehicle_fingerprint" in SUPPORTED_MODULES


def test_evidence_to_dict():
    ev = Evidence(
        module_name="ocr",
        confidence=0.85,
        matched=True,
        score=0.85,
        metadata={"plate": "ABC-1234"},
        processing_time=12.5,
    )
    d = ev.to_dict()
    assert d["module_name"] == "ocr"
    assert d["confidence"] == 0.85
    assert d["matched"] is True
    assert d["score"] == 0.85
    assert d["metadata"] == {"plate": "ABC-1234"}
    assert d["processing_time"] == 12.5
    assert "timestamp" in d


def test_evidence_all_modules():
    for name in ["plate_detection", "ocr", "face_recognition", "vehicle_fingerprint"]:
        ev = Evidence(module_name=name, confidence=0.0, matched=False)
        assert ev.module_name == name
