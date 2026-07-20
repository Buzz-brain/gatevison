import pytest

from app.services.decision.confidence_fusion import ConfidenceFusion
from app.services.decision.evidence import Evidence


def test_fusion_empty():
    fusion = ConfidenceFusion(
        weights={
            "plate_detection": 0.20,
            "ocr": 0.30,
            "face_recognition": 0.25,
            "vehicle_fingerprint": 0.25,
        }
    )
    result = fusion.fuse([])
    assert result.overall_confidence == 0.0
    assert result.breakdown.get("no_evidence") is True


def test_fusion_single_module():
    fusion = ConfidenceFusion(
        weights={"plate_detection": 1.0, "ocr": 0.0,
                 "face_recognition": 0.0, "vehicle_fingerprint": 0.0}
    )
    ev = Evidence(module_name="plate_detection", confidence=0.8, matched=True)
    result = fusion.fuse([ev])
    assert result.overall_confidence == 0.8
    assert result.module_contributions["plate_detection"] == 0.8


def test_fusion_two_modules():
    fusion = ConfidenceFusion(
        weights={"plate_detection": 0.5, "ocr": 0.5,
                 "face_recognition": 0.0, "vehicle_fingerprint": 0.0}
    )
    evs = [
        Evidence(module_name="plate_detection", confidence=1.0, matched=True),
        Evidence(module_name="ocr", confidence=0.5, matched=True),
    ]
    result = fusion.fuse(evs)
    assert result.overall_confidence == pytest.approx(0.75, 0.01)
    assert result.module_contributions["plate_detection"] == 0.5
    assert result.module_contributions["ocr"] == 0.25


def test_fusion_all_equal():
    fusion = ConfidenceFusion(
        weights={"plate_detection": 0.25, "ocr": 0.25,
                 "face_recognition": 0.25, "vehicle_fingerprint": 0.25}
    )
    evs = [
        Evidence(module_name="plate_detection", confidence=1.0, matched=True),
        Evidence(module_name="ocr", confidence=1.0, matched=True),
        Evidence(module_name="face_recognition", confidence=1.0, matched=True),
        Evidence(module_name="vehicle_fingerprint", confidence=1.0, matched=True),
    ]
    result = fusion.fuse(evs)
    assert result.overall_confidence == pytest.approx(1.0, 0.01)


def test_fusion_weights_normalized():
    fusion = ConfidenceFusion(
        weights={"plate_detection": 10, "ocr": 20,
                 "face_recognition": 0, "vehicle_fingerprint": 0}
    )
    assert fusion.weights["plate_detection"] == pytest.approx(1 / 3, 0.01)
    assert fusion.weights["ocr"] == pytest.approx(2 / 3, 0.01)


def test_fusion_zero_weights():
    with pytest.raises(ValueError):
        ConfidenceFusion(
            weights={
                "plate_detection": 0, "ocr": 0,
                "face_recognition": 0, "vehicle_fingerprint": 0,
            }
        )


def test_fusion_breakdown():
    fusion = ConfidenceFusion(
        weights={"plate_detection": 0.5, "ocr": 0.5,
                 "face_recognition": 0.0, "vehicle_fingerprint": 0.0}
    )
    evs = [
        Evidence(module_name="plate_detection", confidence=0.8, matched=True),
        Evidence(module_name="ocr", confidence=0.6, matched=True),
    ]
    result = fusion.fuse(evs)
    assert "plate_detection" in result.breakdown
    assert "ocr" in result.breakdown
    assert result.breakdown["plate_detection"]["weight"] == 0.5
    assert result.breakdown["plate_detection"]["confidence"] == 0.8
    assert result.breakdown["ocr"]["weight"] == 0.5
    assert result.breakdown["ocr"]["confidence"] == 0.6
