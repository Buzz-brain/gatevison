from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.gate_session import GateSession
from app.repositories.gate_session_repository import GateSessionRepository
from app.services.gate.active_session_matcher import ActiveSessionMatcher


def make_session(session_id, plate, state="INSIDE", vehicle_embedding=None, face_embedding=None):
    s = MagicMock(spec=GateSession)
    s.session_id = session_id
    s.vehicle_id = plate
    s.plate_text = plate
    s.current_state = state
    s.vehicle_embedding = vehicle_embedding
    s.face_embedding = face_embedding
    return s


@pytest.fixture
def matcher():
    return ActiveSessionMatcher()


@pytest.mark.asyncio
async def test_exact_plate_match(matcher):
    sessions = [make_session("ses-1", "ABC-1234")]
    with patch.object(
        GateSessionRepository, "get_vehicles_inside",
        AsyncMock(return_value=sessions),
    ):
        result = await matcher.find_best_match("ABC-1234")
    assert result.matched is True
    assert result.session.session_id == "ses-1"
    assert result.plate_score == 1.0


@pytest.mark.asyncio
async def test_plate_normalization(matcher):
    sessions = [make_session("ses-1", "ABC 1234")]
    with patch.object(
        GateSessionRepository, "get_vehicles_inside",
        AsyncMock(return_value=sessions),
    ):
        result = await matcher.find_best_match("abc1234")
    assert result.matched is True
    assert result.plate_score == 1.0


@pytest.mark.asyncio
async def test_no_active_sessions(matcher):
    with patch.object(
        GateSessionRepository, "get_vehicles_inside",
        AsyncMock(return_value=[]),
    ):
        result = await matcher.find_best_match("ABC-1234")
    assert result.matched is False
    assert "No active sessions" in result.reason


@pytest.mark.asyncio
async def test_plate_mismatch_no_embedding(matcher):
    sessions = [make_session("ses-1", "XYZ-9999")]
    with patch.object(
        GateSessionRepository, "get_vehicles_inside",
        AsyncMock(return_value=sessions),
    ):
        result = await matcher.find_best_match("ABC-1234")
    assert result.matched is False


@pytest.mark.asyncio
async def test_plate_mismatch_strong_embedding_match(matcher):
    query_emb = [1.0, 0.0]
    sessions = [
        make_session("ses-1", "XYZ-9999", vehicle_embedding=[0.99, 0.01]),
    ]
    with patch.object(
        GateSessionRepository, "get_vehicles_inside",
        AsyncMock(return_value=sessions),
    ):
        result = await matcher.find_best_match(
            "ABC-1234", vehicle_embedding=query_emb,
        )
    assert result.matched is True
    assert result.vehicle_score > 0.85


@pytest.mark.asyncio
async def test_face_embedding_boost(matcher):
    query_emb = [1.0, 0.0]
    sessions = [
        make_session(
            "ses-1", "ABC-1234",
            face_embedding=[0.99, 0.01],
        ),
    ]
    with patch.object(
        GateSessionRepository, "get_vehicles_inside",
        AsyncMock(return_value=sessions),
    ):
        result = await matcher.find_best_match(
            "ABC-1234", face_embedding=query_emb,
        )
    assert result.matched is True
    assert result.face_score > 0.9


@pytest.mark.asyncio
async def test_best_candidate_selected(matcher):
    query_emb = [1.0, 0.0]
    sessions = [
        make_session("ses-1", "AAA-1111", vehicle_embedding=[0.1, 0.9]),
        make_session("ses-2", "ABC-1234", vehicle_embedding=[0.95, 0.05]),
    ]
    with patch.object(
        GateSessionRepository, "get_vehicles_inside",
        AsyncMock(return_value=sessions),
    ):
        result = await matcher.find_best_match(
            "ABC-1234", vehicle_embedding=query_emb,
        )
    assert result.matched is True
    assert result.session.session_id == "ses-2"


def test_to_dict_shape(matcher):
    from app.services.gate.active_session_matcher import MatchResult
    result = MatchResult(matched=True, score=0.9, plate_score=1.0)
    d = result.to_dict()
    assert "matched" in d
    assert "score" in d
    assert d["session_id"] is None
