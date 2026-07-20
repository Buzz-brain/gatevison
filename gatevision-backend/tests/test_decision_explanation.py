from app.services.decision.confidence_fusion import ConfidenceFusion
from app.services.decision.evidence import Evidence
from app.services.decision.explanation_builder import ExplanationBuilder
from app.services.decision.rule_engine import Decision, RuleResult


def test_explanation_grant():
    builder = ExplanationBuilder()
    evs = [
        Evidence(module_name="plate_detection", confidence=0.98, matched=True),
        Evidence(module_name="ocr", confidence=0.92, matched=True),
        Evidence(module_name="face_recognition", confidence=0.88,
                 matched=True, score=0.88),
        Evidence(module_name="vehicle_fingerprint", confidence=1.0, matched=True),
    ]
    fusion = ConfidenceFusion(
        weights={"plate_detection": 0.25, "ocr": 0.25,
                 "face_recognition": 0.25, "vehicle_fingerprint": 0.25}
    ).fuse(evs)
    rule_result = RuleResult(decision=Decision.GRANT, triggered_rules=["all_evidence_passed"])
    explanation = builder.build(evs, fusion, rule_result)
    assert "Access Granted" in explanation
    assert "Plate detected" in explanation
    assert "OCR text recognition" in explanation
    assert "Driver face matched" in explanation
    assert "Vehicle fingerprint matched" in explanation
    assert "Overall confidence" in explanation


def test_explanation_deny():
    builder = ExplanationBuilder()
    evs = [
        Evidence(module_name="plate_detection", confidence=0.0, matched=False),
    ]
    fusion = ConfidenceFusion(
        weights={"plate_detection": 1.0, "ocr": 0.0,
                 "face_recognition": 0.0, "vehicle_fingerprint": 0.0}
    ).fuse(evs)
    rule_result = RuleResult(decision=Decision.DENY, triggered_rules=["plate_detection_failed"])
    explanation = builder.build(evs, fusion, rule_result)
    assert "Access Denied" in explanation
    assert "Plate detected" in explanation


def test_explanation_manual_review():
    builder = ExplanationBuilder()
    evs = [
        Evidence(module_name="plate_detection", confidence=0.95, matched=True),
        Evidence(module_name="ocr", confidence=0.4, matched=False),
        Evidence(module_name="face_recognition", confidence=0.2,
                 matched=False, score=0.2),
        Evidence(module_name="vehicle_fingerprint", confidence=1.0, matched=True),
    ]
    fusion = ConfidenceFusion(
        weights={"plate_detection": 0.25, "ocr": 0.25,
                 "face_recognition": 0.25, "vehicle_fingerprint": 0.25}
    ).fuse(evs)
    rule_result = RuleResult(
        decision=Decision.MANUAL_REVIEW,
        triggered_rules=["vehicle_match_no_face"],
    )
    explanation = builder.build(evs, fusion, rule_result)
    assert "Manual Review Required" in explanation
    assert "Rules triggered" in explanation


def test_explanation_face_not_matched():
    builder = ExplanationBuilder()
    evs = [
        Evidence(module_name="plate_detection", confidence=0.95, matched=True),
        Evidence(module_name="ocr", confidence=0.9, matched=True),
        Evidence(module_name="face_recognition", confidence=0.3,
                 matched=False, score=0.3),
    ]
    fusion = ConfidenceFusion(
        weights={"plate_detection": 0.34, "ocr": 0.33,
                 "face_recognition": 0.33, "vehicle_fingerprint": 0.0}
    ).fuse(evs)
    rule_result = RuleResult(
        decision=Decision.MANUAL_REVIEW,
        triggered_rules=["default_manual_review"],
    )
    explanation = builder.build(evs, fusion, rule_result)
    assert "face did not match" in explanation
