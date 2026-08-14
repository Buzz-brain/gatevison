from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.services.ai.orchestrator.orchestrator import (
    PipelineOrchestrator,
    PipelineServices,
)
from app.services.ai.orchestrator.pipeline_context import PipelineContext
from app.services.gate.workflow_service import WorkflowService


@pytest.fixture
def sample_frame():
    return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


def make_pipeline_result(decision="GRANT"):
    return {
        "decision": decision,
        "overall_confidence": 0.95,
        "explanation": "ok",
        "evidence": [],
        "fusion_breakdown": {},
        "triggered_rules": [],
        "processing_time": 5.0,
        "session_verification": {"plate_found": True, "decision": "GRANT"},
    }


def make_workflow_result(success=True, action="ENTRY"):
    result = MagicMock()
    result.success = success
    result.action = action
    result.vehicle_id = "ABC-1234"
    result.message = "Processed" if success else "Rejected"
    result.error = None if success else "Some error"
    result.session = {"session_id": "ses-001", "current_state": "INSIDE"}
    result.transaction = {"transaction_id": "txn-001", "action": action}
    return result


def build_orchestrator(direction="entry"):
    mock_det_svc = MagicMock()
    mock_det_svc.detect_from_frame = AsyncMock(
        return_value={
            "detections": [
                {
                    "bbox": [25, 40, 75, 40, 75, 60, 25, 60],
                    "confidence": 0.95,
                    "cropped_plate_path": "/tmp/plate.jpg",
                }
            ],
        }
    )
    mock_ocr_svc = MagicMock()
    mock_ocr_svc.read_many = AsyncMock(
        return_value=[{
            "plate_index": 0,
            "raw_text": "ABC-1234",
            "cleaned_text": "ABC-1234",
            "confidence": 0.92,
            "validation_status": "validated",
            "validation_message": "",
        }]
    )
    mock_wf_svc = MagicMock(spec=WorkflowService)
    mock_wf_svc.run_session_entry = AsyncMock(
        return_value=make_workflow_result(success=True, action="ENTRY")
    )
    mock_wf_svc.run_session_exit = AsyncMock(
        return_value=make_workflow_result(success=True, action="EXIT")
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
            to_dict=MagicMock(return_value=make_pipeline_result())
        )
    )
    orchestrator = PipelineOrchestrator(services=services)
    return orchestrator, mock_wf_svc


@pytest.mark.asyncio
async def test_session_mode_entry_dispatch(sample_frame):
    orchestrator, wf = build_orchestrator(direction="entry")
    ctx = PipelineContext(direction="entry")
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    wf.run_session_entry.assert_called_once()
    wf.run_session_exit.assert_not_called()
    assert result.gate_workflow_result["action"] == "ENTRY"


@pytest.mark.asyncio
async def test_session_mode_exit_dispatch(sample_frame):
    orchestrator, wf = build_orchestrator(direction="exit")
    ctx = PipelineContext(direction="exit")
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    wf.run_session_exit.assert_called_once()
    wf.run_session_entry.assert_not_called()
    assert result.gate_workflow_result["action"] == "EXIT"


@pytest.mark.asyncio
async def test_session_mode_exit_face_mismatch_surfaces(sample_frame):
    orchestrator, wf = build_orchestrator(direction="exit")
    rejected = MagicMock()
    rejected.success = False
    rejected.action = "EXIT"
    rejected.vehicle_id = "ABC-1234"
    rejected.message = "Exit rejected"
    rejected.error = "Face does not match the entry driver"
    rejected.session = None
    rejected.transaction = None
    wf.run_session_exit = AsyncMock(return_value=rejected)

    ctx = PipelineContext(direction="exit")
    ctx.frame = sample_frame

    result = await orchestrator.execute(ctx)
    wf.run_session_exit.assert_called_once()
    assert result.gate_workflow_result["success"] is False
    assert result.gate_workflow_result["action"] == "EXIT"
    assert "Face does not match" in result.gate_workflow_result["error"]
    assert result.decision["decision"] == "DENY"
    assert "Face does not match" in result.decision["explanation"]
