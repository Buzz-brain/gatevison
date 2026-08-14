from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.gate.active_session_matcher import MatchResult
from app.services.gate.session_gate_service import SessionGateError, SessionGateService


@pytest.fixture
def session():
    s = MagicMock()
    s.session_id = "ses-001"
    s.vehicle_id = "ABC-1234"
    s.current_state = "OUTSIDE"
    return s


@pytest.fixture
def inside_session():
    s = MagicMock()
    s.session_id = "ses-001"
    s.vehicle_id = "ABC-1234"
    s.current_state = "INSIDE"
    return s


@pytest.fixture
def txn():
    t = MagicMock()
    t.transaction_id = "txn-001"
    t.session_id = "ses-001"
    t.action = "ENTRY"
    t.decision = "GRANT"
    return t


def build_service(sessions_mock=None, matcher=None):
    session_svc = MagicMock()
    txn_svc = MagicMock()
    service = SessionGateService(
        session_service=session_svc,
        transaction_service=txn_svc,
        matcher=matcher or MagicMock(),
        verification_service=MagicMock(),
    )
    if sessions_mock is not None:
        service._sessions = sessions_mock
    return service, session_svc, txn_svc


@pytest.mark.asyncio
async def test_create_entry_session(session, txn):
    svc, session_svc, txn_svc = build_service()
    session_svc.open_session = AsyncMock(return_value=session)
    txn_svc.create_transaction = AsyncMock(return_value=txn)

    s, t = await svc.create_entry_session(
        plate_text="ABC-1234",
        request_id="req-1",
        face_embedding=[0.1, 0.2],
        vehicle_embedding=[0.3, 0.4],
    )
    assert s.session_id == "ses-001"
    assert t.action == "ENTRY"
    session_svc.open_session.assert_called_once()


@pytest.mark.asyncio
async def test_create_entry_session_not_grant():
    svc, _, _ = build_service()
    with pytest.raises(SessionGateError, match="only GRANT allowed"):
        await svc.create_entry_session(
            plate_text="ABC-1234", decision="DENY",
        )


@pytest.mark.asyncio
async def test_validate_exit_session_match(session, txn):
    txn.action = "EXIT"
    svc, session_svc, txn_svc = build_service()
    session_svc.close_session_by_id = AsyncMock(return_value=session)
    session_svc.attach_exit_confidence = AsyncMock(return_value=session)
    txn_svc.create_transaction = AsyncMock(return_value=txn)

    match = MatchResult(matched=True, session=session, score=0.92)
    svc._matcher.find_best_match = AsyncMock(return_value=match)

    s, t, m = await svc.validate_exit_session(plate_text="ABC-1234")
    assert t.action == "EXIT"
    assert m.matched is True
    session_svc.close_session_by_id.assert_called_once_with("ses-001")


@pytest.mark.asyncio
async def test_validate_exit_session_no_match(session):
    svc, session_svc, _ = build_service()
    match = MatchResult(matched=False, reason="No active session matched")
    svc._matcher.find_best_match = AsyncMock(return_value=match)

    with pytest.raises(SessionGateError, match="No active session matched"):
        await svc.validate_exit_session(plate_text="ABC-1234")
    session_svc.close_session_by_id.assert_not_called()


@pytest.mark.asyncio
async def test_validate_exit_session_not_grant():
    svc, _, _ = build_service()
    with pytest.raises(SessionGateError, match="only GRANT allowed"):
        await svc.validate_exit_session(
            plate_text="ABC-1234", decision="MANUAL_REVIEW",
        )


@pytest.mark.asyncio
async def test_verification_to_dict():
    svc, _, _ = build_service()
    from app.services.gate.session_verification_service import (
        SessionVerificationResult,
    )
    result = SessionVerificationResult(plate_found=True, decision="GRANT")
    d = svc._verification_to_dict(result)
    assert d["decision"] == "GRANT"
    assert svc._verification_to_dict({"a": 1}) == {"a": 1}
    assert svc._verification_to_dict(None) is None
