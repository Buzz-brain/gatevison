import pytest

from app.services.gate.session_verification_service import (
    SessionVerificationService,
)


@pytest.fixture
def svc():
    return SessionVerificationService()


def test_grant_full_capture(svc):
    result = svc.verify_capture(
        plate_text="ABC-1234",
        plate_confidence=0.92,
        validation_status="validated",
        face_embedding=[0.1, 0.2, 0.3],
        face_confidence=0.9,
        vehicle_embedding=[0.4, 0.5, 0.6],
        vehicle_confidence=0.8,
    )
    assert result.plate_found is True
    assert result.face_captured is True
    assert result.vehicle_captured is True
    assert result.decision == "GRANT"
    assert result.capture_confidence > 0


def test_grant_plate_only_when_not_required(svc):
    result = svc.verify_capture(
        plate_text="ABC-1234",
        plate_confidence=0.92,
        validation_status="validated",
    )
    assert result.decision == "GRANT"
    assert result.face_captured is False
    assert result.vehicle_captured is False


def test_deny_no_plate(svc):
    result = svc.verify_capture(
        plate_text="",
        plate_confidence=0.0,
    )
    assert result.plate_found is False
    assert result.decision == "DENY"


def test_manual_review_low_plate_confidence(svc):
    result = svc.verify_capture(
        plate_text="ABC-1234",
        plate_confidence=0.1,
        validation_status="validated",
    )
    assert result.plate_found is False
    assert result.decision == "MANUAL_REVIEW"


def test_valid_status_counts_as_plate_found(svc):
    result = svc.verify_capture(
        plate_text="KJA987FT",
        plate_confidence=0.77,
        validation_status="valid",
    )
    assert result.plate_found is True
    assert result.decision == "GRANT"


def test_manual_review_unvalidated_plate(svc):
    result = svc.verify_capture(
        plate_text="ABC-1234",
        plate_confidence=0.92,
        validation_status="invalid",
    )
    assert result.decision == "MANUAL_REVIEW"


def test_require_face_missing(svc):
    svc._require_face = True
    result = svc.verify_capture(
        plate_text="ABC-1234",
        plate_confidence=0.92,
        validation_status="validated",
    )
    assert result.decision == "MANUAL_REVIEW"


def test_require_vehicle_missing(svc):
    svc._require_vehicle = True
    result = svc.verify_capture(
        plate_text="ABC-1234",
        plate_confidence=0.92,
        validation_status="validated",
        face_embedding=[0.1, 0.2, 0.3],
        face_confidence=0.9,
    )
    assert result.decision == "MANUAL_REVIEW"


def test_matched_signals_count_as_captured(svc):
    result = svc.verify_capture(
        plate_text="ABC-1234",
        plate_confidence=0.92,
        validation_status="validated",
        face_matched=True,
        face_similarity=0.88,
        vehicle_detected=True,
    )
    assert result.face_captured is True
    assert result.vehicle_captured is True
    assert result.decision == "GRANT"


def test_to_dict_shape(svc):
    result = svc.verify_capture(
        plate_text="ABC-1234",
        plate_confidence=0.92,
        validation_status="validated",
    )
    d = result.to_dict()
    assert d["mode"] == "session"
    assert "plate_found" in d
    assert "capture_confidence" in d
    assert "triggered_rules" in d
    assert d["decision"] == "GRANT"


@pytest.mark.asyncio
async def test_verify_from_pipeline_with_embeddings(svc):
    class StubResult:
        recognized_plates = [
            {"plate": "ABC-1234", "confidence": 0.92, "validation_status": "validated"}
        ]
        face_recognitions = [
            {"face_detected": True, "detections": [
                {"embedding": [0.1, 0.2], "confidence": 0.9},
            ]}
        ]
        vehicle_fingerprints = [
            {"embedding": [0.3, 0.4], "confidence": 0.8}
        ]
        vehicle_detections = [{"detected": True}]

    result = await svc.verify_from_pipeline(StubResult())
    assert result.decision == "GRANT"
    assert result.face_captured is True
    assert result.vehicle_captured is True
