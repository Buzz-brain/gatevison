from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.services.ai.orchestrator.orchestrator import (
    PipelineOrchestrator,
    PipelineServices,
)


@pytest.fixture
def sample_frame():
    return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


def make_stub_engine():
    """Return a DecisionEngine whose evaluate_result returns a controlled output."""
    from app.services.decision.decision_engine import DecisionEngine, DecisionOutput
    from app.services.decision.rule_engine import Decision

    engine = MagicMock(spec=DecisionEngine)
    engine.evaluate_result = AsyncMock(
        return_value=DecisionOutput(
            request_id="pipeline-test",
            decision=Decision.GRANT,
            overall_confidence=0.95,
            explanation="Access Granted.\n\nReason:\n  All evidence passed.",
            evidence=[{"module_name": "ocr", "confidence": 0.9}],
            fusion_breakdown={"ocr": {"weight": 0.3, "confidence": 0.9}},
            triggered_rules=["all_evidence_passed"],
            processing_time=5.0,
        )
    )
    return engine


@pytest.mark.asyncio
async def test_pipeline_with_decision_engine(sample_frame):
    mock_det_svc = MagicMock()
    mock_det_svc.detect_from_frame = AsyncMock(
        return_value={
            "detections": [
                {
                    "bbox": [50, 50, 100, 100, 100, 50, 50, 50],
                    "confidence": 0.95,
                    "cropped_plate_path": "/tmp/plate.jpg",
                }
            ],
        }
    )

    mock_ocr_svc = MagicMock()
    mock_ocr_svc.read_from_image = AsyncMock()

    stub_engine = make_stub_engine()

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=None,
        vehicle_fingerprint_service=None,
        decision_engine=stub_engine,
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    assert result.decision is not None
    assert result.decision["decision"] == "GRANT"
    assert result.decision["overall_confidence"] == 0.95
    assert "explanation" in result.decision
    stub_engine.evaluate_result.assert_called_once()


@pytest.mark.asyncio
async def test_pipeline_decision_error_handling(sample_frame):
    mock_det_svc = MagicMock()
    mock_det_svc.detect_from_frame = AsyncMock(
        return_value={"detections": []}
    )

    mock_ocr_svc = MagicMock()
    mock_ocr_svc.read_from_image = AsyncMock()

    engine = MagicMock()
    engine.evaluate_result = AsyncMock(
        side_effect=Exception("Decision engine failure")
    )

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=None,
        vehicle_fingerprint_service=None,
        decision_engine=engine,
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    assert result.decision is not None
    assert result.decision["decision"] == "MANUAL_REVIEW"
    assert "error" in result.decision


@pytest.mark.asyncio
async def test_pipeline_without_decision_engine(sample_frame):
    mock_det_svc = MagicMock()
    mock_det_svc.detect_from_frame = AsyncMock(
        return_value={"detections": []}
    )

    mock_ocr_svc = MagicMock()
    mock_ocr_svc.read_from_image = AsyncMock()

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=None,
        vehicle_fingerprint_service=None,
        decision_engine=None,
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    assert result.decision is None


@pytest.mark.asyncio
async def test_pipeline_decision_full_flow(sample_frame):
    from app.services.decision.decision_engine import DecisionEngine

    mock_det_svc = MagicMock()
    mock_det_svc.detect_from_frame = AsyncMock(
        return_value={
            "detections": [
                {
                    "bbox": [50, 50, 100, 100, 100, 50, 50, 50],
                    "confidence": 0.98,
                    "cropped_plate_path": "",
                }
            ],
        }
    )

    mock_ocr_svc = MagicMock()
    mock_ocr_svc.read_from_image = AsyncMock()

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=None,
        vehicle_fingerprint_service=None,
        decision_engine=DecisionEngine(),
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    assert result.decision is not None
    assert result.decision["decision"] in ("GRANT", "DENY", "MANUAL_REVIEW")
    assert result.decision["overall_confidence"] >= 0
