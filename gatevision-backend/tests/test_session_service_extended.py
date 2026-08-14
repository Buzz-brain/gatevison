from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.gate.session_service import SessionError, SessionService


@pytest.fixture(autouse=True)
def mock_gate_session():
    with patch("app.services.gate.session_service.GateSession") as mock_gs:
        mock_gs.return_value = MagicMock()
        yield


@pytest.fixture
def mock_inside_session():
    session = MagicMock()
    session.session_id = "ses-001"
    session.vehicle_id = "ABC-1234"
    session.current_state = "INSIDE"
    session.active = True
    return session


@pytest.fixture
def mock_outside_session():
    session = MagicMock()
    session.session_id = "ses-001"
    session.vehicle_id = "ABC-1234"
    session.current_state = "OUTSIDE"
    session.active = True
    return session


def build_service(repo):
    svc = SessionService()
    svc._repo = repo
    return svc


@pytest.mark.asyncio
async def test_open_session_new(mock_outside_session):
    repo = MagicMock()
    repo.get_active_by_vehicle_id = AsyncMock(return_value=None)
    repo.create = AsyncMock(return_value=mock_outside_session)
    repo.update = AsyncMock(side_effect=lambda s: s)
    svc = build_service(repo)

    result = await svc.open_session(
        vehicle_id="ABC-1234",
        plate_text="ABC-1234",
        vehicle_embedding=[0.1, 0.2],
        face_embedding=[0.3, 0.4],
        confidence={"capture_confidence": 0.9},
        decision_mode="session",
    )
    assert result.current_state == "INSIDE"
    assert result.plate_text == "ABC-1234"
    repo.create.assert_called_once()


@pytest.mark.asyncio
async def test_open_session_existing_outside(mock_outside_session):
    repo = MagicMock()
    repo.get_active_by_vehicle_id = AsyncMock(return_value=mock_outside_session)
    repo.update = AsyncMock(return_value=mock_outside_session)
    svc = build_service(repo)

    result = await svc.open_session(vehicle_id="ABC-1234")
    assert result.current_state == "INSIDE"
    repo.create.assert_not_called()


@pytest.mark.asyncio
async def test_open_session_already_inside(mock_inside_session):
    repo = MagicMock()
    repo.get_active_by_vehicle_id = AsyncMock(return_value=mock_inside_session)
    svc = build_service(repo)

    with pytest.raises(SessionError, match="already INSIDE"):
        await svc.open_session(vehicle_id="ABC-1234")


@pytest.mark.asyncio
async def test_close_session_by_id(mock_inside_session):
    repo = MagicMock()
    repo.get_by_session_id = AsyncMock(return_value=mock_inside_session)
    repo.update = AsyncMock(return_value=mock_inside_session)
    svc = build_service(repo)

    result = await svc.close_session_by_id("ses-001")
    assert result.current_state == "OUTSIDE"
    assert result.last_exit_time is not None


@pytest.mark.asyncio
async def test_close_session_not_found():
    repo = MagicMock()
    repo.get_by_session_id = AsyncMock(return_value=None)
    svc = build_service(repo)

    with pytest.raises(SessionError, match="No active session"):
        await svc.close_session_by_id("ses-001")


@pytest.mark.asyncio
async def test_attach_exit_confidence(mock_inside_session):
    repo = MagicMock()
    repo.get_by_session_id = AsyncMock(return_value=mock_inside_session)
    repo.update = AsyncMock(return_value=mock_inside_session)
    svc = build_service(repo)

    result = await svc.attach_exit_confidence("ses-001", {"score": 0.9})
    assert result.exit_confidence == {"score": 0.9}
    repo.update.assert_called_once()


@pytest.mark.asyncio
async def test_attach_exit_confidence_none():
    repo = MagicMock()
    svc = build_service(repo)
    result = await svc.attach_exit_confidence("ses-001", None)
    assert result is None
    repo.get_by_session_id.assert_not_called()
