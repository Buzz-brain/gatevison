import pytest

from app.services.decision.confidence_fusion import ConfidenceFusion
from app.services.decision.evidence import Evidence
from app.services.decision.rule_engine import Decision, RuleEngine


def mk_ev(module, confidence, matched, score=None):
    return Evidence(module_name=module, confidence=confidence,
                    matched=matched, score=score)


def mk_fusion(evs):
    weights = {"plate_detection": 0.25, "ocr": 0.25,
               "face_recognition": 0.25, "vehicle_fingerprint": 0.25}
    return ConfidenceFusion(weights=weights).fuse(evs)


def test_plate_fails_deny():
    engine = RuleEngine(ocr_threshold=0.5, face_threshold=0.5, vehicle_threshold=0.5)
    evs = [mk_ev("plate_detection", 0.0, False)]
    result = engine.evaluate(evs, mk_fusion(evs))
    assert result.decision == Decision.DENY
    assert "plate_detection_failed" in result.triggered_rules


def test_ocr_low_manual_review():
    engine = RuleEngine(ocr_threshold=0.6, face_threshold=0.5, vehicle_threshold=0.5)
    evs = [
        mk_ev("plate_detection", 0.95, True),
        mk_ev("ocr", 0.4, False),
    ]
    result = engine.evaluate(evs, mk_fusion(evs))
    assert result.decision == Decision.MANUAL_REVIEW
    assert "ocr_below_threshold" in result.triggered_rules


def test_vehicle_match_no_face_manual_review():
    engine = RuleEngine(ocr_threshold=0.5, face_threshold=0.5, vehicle_threshold=0.5)
    evs = [
        mk_ev("plate_detection", 0.95, True),
        mk_ev("ocr", 0.8, True),
        mk_ev("face_recognition", 0.2, False, score=0.2),
        mk_ev("vehicle_fingerprint", 1.0, True),
    ]
    result = engine.evaluate(evs, mk_fusion(evs))
    assert result.decision == Decision.MANUAL_REVIEW
    assert "vehicle_match_no_face" in result.triggered_rules


def test_face_vehicle_match_weak_ocr_manual_review():
    engine = RuleEngine(ocr_threshold=0.7, face_threshold=0.5, vehicle_threshold=0.5)
    evs = [
        mk_ev("plate_detection", 0.95, True),
        mk_ev("ocr", 0.6, True),
        mk_ev("face_recognition", 0.9, True, score=0.9),
        mk_ev("vehicle_fingerprint", 1.0, True),
    ]
    result = engine.evaluate(evs, mk_fusion(evs))
    assert result.decision == Decision.MANUAL_REVIEW
    assert "face_vehicle_match_weak_ocr" in result.triggered_rules


def test_all_pass_grant():
    engine = RuleEngine(ocr_threshold=0.5, face_threshold=0.5, vehicle_threshold=0.5)
    evs = [
        mk_ev("plate_detection", 0.95, True),
        mk_ev("ocr", 0.9, True),
        mk_ev("face_recognition", 0.88, True, score=0.88),
        mk_ev("vehicle_fingerprint", 1.0, True),
    ]
    result = engine.evaluate(evs, mk_fusion(evs))
    assert result.decision == Decision.GRANT
    assert "all_evidence_passed" in result.triggered_rules


def test_face_only_grant():
    engine = RuleEngine(ocr_threshold=0.5, face_threshold=0.5, vehicle_threshold=0.5)
    evs = [
        mk_ev("plate_detection", 0.95, True),
        mk_ev("ocr", 0.9, True),
        mk_ev("face_recognition", 0.88, True, score=0.88),
    ]
    result = engine.evaluate(evs, mk_fusion(evs))
    assert result.decision == Decision.GRANT
    assert "face_matched_vehicle_missing" in result.triggered_rules


def test_vehicle_only_manual_review():
    engine = RuleEngine(ocr_threshold=0.5, face_threshold=0.5, vehicle_threshold=0.5)
    evs = [
        mk_ev("plate_detection", 0.95, True),
        mk_ev("ocr", 0.9, True),
        mk_ev("vehicle_fingerprint", 1.0, True),
    ]
    result = engine.evaluate(evs, mk_fusion(evs))
    assert result.decision == Decision.MANUAL_REVIEW
    assert "vehicle_matched_face_missing" in result.triggered_rules


def test_multiple_critical_failures_deny():
    engine = RuleEngine(ocr_threshold=0.5, face_threshold=0.5, vehicle_threshold=0.5)
    evs = [
        mk_ev("plate_detection", 0.95, True),
        mk_ev("ocr", 0.1, False),
        mk_ev("face_recognition", 0.0, False, score=0.0),
        mk_ev("vehicle_fingerprint", 0.0, False),
    ]
    result = engine.evaluate(evs, mk_fusion(evs))
    assert result.decision == Decision.DENY
    assert "multiple_critical_failures" in result.triggered_rules


def test_default_manual_review():
    engine = RuleEngine(ocr_threshold=0.5, face_threshold=0.5, vehicle_threshold=0.5)
    evs = [
        mk_ev("plate_detection", 0.95, True),
        mk_ev("ocr", 0.9, True),
    ]
    result = engine.evaluate(evs, mk_fusion(evs))
    assert result.decision == Decision.MANUAL_REVIEW
    assert "default_manual_review" in result.triggered_rules


def test_no_plate_evidence_deny():
    engine = RuleEngine(ocr_threshold=0.5, face_threshold=0.5, vehicle_threshold=0.5)
    result = engine.evaluate([], mk_fusion([]))
    assert result.decision == Decision.DENY
