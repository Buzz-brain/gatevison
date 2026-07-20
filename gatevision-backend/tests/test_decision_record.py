from unittest.mock import MagicMock, patch

from app.models.decision_record import DecisionRecord


@patch("app.models.decision_record.DecisionRecord.get_settings")
def test_decision_record_creation(mock_settings):
    mock_settings.return_value = MagicMock()
    record = DecisionRecord(
        request_id="req-123",
        decision="GRANT",
        overall_confidence=0.92,
        explanation="Access Granted.",
        evidence=[{"module_name": "ocr", "confidence": 0.9}],
        fusion_breakdown={"ocr": {"weight": 0.3, "confidence": 0.9}},
        triggered_rules=["all_evidence_passed"],
        processing_time=15.0,
    )
    assert record.request_id == "req-123"
    assert record.decision == "GRANT"
    assert record.overall_confidence == 0.92
    assert len(record.evidence) == 1
    assert "ocr" in record.fusion_breakdown
    assert record.triggered_rules == ["all_evidence_passed"]
    assert record.processing_time == 15.0
    assert record.created_at is not None


@patch("app.models.decision_record.DecisionRecord.get_settings")
def test_decision_record_repr(mock_settings):
    mock_settings.return_value = MagicMock()
    record = DecisionRecord(
        request_id="req-456",
        decision="DENY",
        overall_confidence=0.0,
    )
    assert "req-456" in repr(record)
    assert "DENY" in repr(record)
