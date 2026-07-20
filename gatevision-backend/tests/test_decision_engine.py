from unittest.mock import MagicMock, patch

import pytest

from app.services.ai.orchestrator.pipeline_result import PipelineResult
from app.services.decision.decision_engine import DecisionEngine
from app.services.decision.evidence import Evidence
from app.services.decision.rule_engine import Decision


@pytest.fixture
def engine():
    return DecisionEngine()


@pytest.mark.asyncio
async def test_evaluate_result_grant(engine):
    result = PipelineResult(
        success=True,
        request_id="test-req",
        total_processing_time=100.0,
        detected_plates=[{"bbox": [], "confidence": 0.95}],
        recognized_plates=[
            {"plate": "ABC-1234", "confidence": 0.92,
             "validation_status": "validated"}
        ],
        face_recognitions=[
            {"face_detected": True, "face_count": 1,
             "similarity_score": 0.88, "matched": True}
        ],
        vehicle_detections=[{"detected": True, "embedding_count": 1}],
        vehicle_fingerprints=[{"dimension": 2048, "duration_ms": 50.0}],
    )
    output = await engine.evaluate_result(result)
    assert output.decision == Decision.GRANT
    assert output.request_id == "test-req"
    assert output.overall_confidence > 0
    assert len(output.explanation) > 0
    assert len(output.evidence) == 4
    assert len(output.triggered_rules) > 0
    assert output.processing_time >= 0


@pytest.mark.asyncio
async def test_evaluate_result_deny(engine):
    result = PipelineResult(
        success=False,
        request_id="test-req",
        total_processing_time=0.0,
    )
    output = await engine.evaluate_result(result)
    assert output.decision == Decision.DENY
    assert output.overall_confidence == 0.0


@pytest.mark.asyncio
async def test_evaluate_evidence_direct(engine):
    evs = [
        Evidence(module_name="plate_detection", confidence=0.95, matched=True),
        Evidence(module_name="ocr", confidence=0.9, matched=True),
        Evidence(module_name="face_recognition", confidence=0.85,
                 matched=True, score=0.85),
        Evidence(module_name="vehicle_fingerprint", confidence=1.0, matched=True),
    ]
    output = await engine.evaluate_evidence(evs)
    assert output.decision == Decision.GRANT


@pytest.mark.asyncio
async def test_evaluate_evidence_manual_review(engine):
    evs = [
        Evidence(module_name="plate_detection", confidence=0.95, matched=True),
        Evidence(module_name="ocr", confidence=0.3, matched=False),
    ]
    output = await engine.evaluate_evidence(evs)
    assert output.decision == Decision.MANUAL_REVIEW


@pytest.mark.asyncio
async def test_get_rules_config(engine):
    config = engine.get_rules_config()
    assert "weights" in config
    assert "thresholds" in config
    assert "ocr" in config["thresholds"]
    assert "face" in config["thresholds"]
    assert "vehicle" in config["thresholds"]


@pytest.mark.asyncio
async def test_engine_does_not_call_ai(engine):
    result = PipelineResult(
        success=True,
        request_id="test",
        total_processing_time=0.0,
        detected_plates=[{"bbox": [], "confidence": 0.9}],
        recognized_plates=[
            {"plate": "ABC", "confidence": 0.8, "validation_status": "validated"}
        ],
    )
    output = await engine.evaluate_result(result)
    assert output.decision is not None
