from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.services.ai.orchestrator.orchestrator import (
    PipelineOrchestrator,
    PipelineServices,
)
from app.services.gate.workflow_service import WorkflowService


@pytest.fixture
def sample_frame():
    return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


def make_workflow_result(success=True, action="ENTRY"):
    result = MagicMock()
    result.success = success
    result.action = action
    result.vehicle_id = "ABC-1234"
    result.message = "Processed" if success else "Rejected"
    result.error = None if success else "Some error"
    result.session = {
        "session_id": "ses-001",
        "vehicle_id": "ABC-1234",
        "current_state": "INSIDE" if action == "ENTRY" else "OUTSIDE",
    }
    result.transaction = {
        "transaction_id": "txn-001",
        "action": action,
        "decision": "GRANT",
        "timestamp": "2024-01-01T00:00:00",
    }
    return result


@pytest.mark.asyncio
async def test_pipeline_with_gate_workflow(sample_frame):
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
    mock_ocr_svc.read_from_image = AsyncMock(
        return_value=MagicMock(
            raw_text="ABC-1234",
            cleaned_text="ABC-1234",
            confidence=0.92,
            validation_status="validated",
            validation_message="",
        )
    )

    mock_wf_svc = MagicMock(spec=WorkflowService)
    mock_wf_svc.run_entry_workflow = AsyncMock(
        return_value=make_workflow_result(success=True, action="ENTRY")
    )

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=None,
        vehicle_fingerprint_service=None,
        decision_engine=MagicMock(),
        gate_workflow_service=mock_wf_svc,
    )
    services.decision_engine.evaluate_result = AsyncMock(
        return_value=MagicMock(
            to_dict=MagicMock(
                return_value={
                    "decision": "GRANT",
                    "overall_confidence": 0.95,
                    "explanation": "All evidence passed",
                    "evidence": [],
                    "fusion_breakdown": {},
                    "triggered_rules": ["all_evidence_passed"],
                    "processing_time": 5.0,
                }
            )
        )
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    assert result.decision is not None
    assert result.decision["decision"] == "GRANT"
    assert result.gate_workflow_result is not None
    assert result.gate_workflow_result["success"] is True
    assert result.gate_workflow_result["action"] == "ENTRY"


@pytest.mark.asyncio
async def test_pipeline_gate_workflow_no_plate(sample_frame):
    mock_det_svc = MagicMock()
    mock_det_svc.detect_from_frame = AsyncMock(
        return_value={"detections": []}
    )

    mock_ocr_svc = MagicMock()
    mock_ocr_svc.read_from_image = AsyncMock()

    mock_wf_svc = MagicMock(spec=WorkflowService)

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=None,
        vehicle_fingerprint_service=None,
        decision_engine=MagicMock(),
        gate_workflow_service=mock_wf_svc,
    )
    services.decision_engine.evaluate_result = AsyncMock(
        return_value=MagicMock(
            to_dict=MagicMock(
                return_value={
                    "decision": "GRANT",
                    "overall_confidence": 0.95,
                    "explanation": "",
                    "evidence": [],
                    "fusion_breakdown": {},
                    "triggered_rules": [],
                    "processing_time": 5.0,
                }
            )
        )
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    assert result.gate_workflow_result is not None
    assert result.gate_workflow_result["success"] is False


@pytest.mark.asyncio
async def test_pipeline_gate_workflow_not_grant(sample_frame):
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
    mock_ocr_svc.read_from_image = AsyncMock(
        return_value=MagicMock(
            raw_text="ABC-1234",
            cleaned_text="ABC-1234",
            confidence=0.92,
            validation_status="validated",
            validation_message="",
        )
    )

    mock_wf_svc = MagicMock(spec=WorkflowService)

    services = PipelineServices(
        detection_service=mock_det_svc,
        ocr_service=mock_ocr_svc,
        face_recognition_service=None,
        vehicle_fingerprint_service=None,
        decision_engine=MagicMock(),
        gate_workflow_service=mock_wf_svc,
    )
    services.decision_engine.evaluate_result = AsyncMock(
        return_value=MagicMock(
            to_dict=MagicMock(
                return_value={
                    "decision": "DENY",
                    "overall_confidence": 0.0,
                    "explanation": "Denied",
                    "evidence": [],
                    "fusion_breakdown": {},
                    "triggered_rules": [],
                    "processing_time": 5.0,
                }
            )
        )
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    assert result.gate_workflow_result is not None
    assert result.gate_workflow_result["success"] is False
    mock_wf_svc.run_entry_workflow.assert_not_called()


@pytest.mark.asyncio
async def test_pipeline_without_gate_workflow(sample_frame):
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
        gate_workflow_service=None,
    )

    orchestrator = PipelineOrchestrator(services=services)

    from app.services.ai.orchestrator.pipeline_context import PipelineContext

    ctx = PipelineContext()
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    assert result.decision is None
    assert result.gate_workflow_result is None
