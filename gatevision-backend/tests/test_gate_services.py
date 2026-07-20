from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.gate.entry_service import EntryError, EntryService
from app.services.gate.exit_service import ExitError, ExitService
from app.services.gate.session_service import SessionError, SessionService
from app.services.gate.transaction_service import TransactionService
from app.services.gate.workflow_service import WorkflowService


@pytest.fixture(autouse=True)
def mock_gate_models():
    with patch("app.services.gate.session_service.GateSession") as mock_gs, \
         patch("app.services.gate.transaction_service.GateTransaction") as mock_gt:
        mock_gs.return_value = MagicMock()
        mock_gt.return_value = MagicMock()
        yield


@pytest.fixture
def mock_session():
    session = MagicMock()
    session.session_id = "ses-001"
    session.vehicle_id = "ABC-1234"
    session.current_state = "OUTSIDE"
    session.active = True
    return session


@pytest.fixture
def mock_inside_session():
    session = MagicMock()
    session.session_id = "ses-001"
    session.vehicle_id = "ABC-1234"
    session.current_state = "INSIDE"
    session.active = True
    return session


@pytest.fixture
def mock_txn():
    txn = MagicMock()
    txn.transaction_id = "txn-001"
    txn.session_id = "ses-001"
    txn.vehicle_id = "ABC-1234"
    txn.action = "ENTRY"
    txn.decision = "GRANT"
    return txn


# ── SessionService ──────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_or_create_session_new(mock_session):
    svc = SessionService()
    repo = MagicMock()
    repo.get_active_by_vehicle_id = AsyncMock(return_value=None)
    repo.create = AsyncMock(return_value=mock_session)
    svc._repo = repo

    result = await svc.get_or_create_session("ABC-1234")
    assert result.session_id == "ses-001"
    repo.get_active_by_vehicle_id.assert_called_once_with("ABC-1234")
    repo.create.assert_called_once()


@pytest.mark.asyncio
async def test_get_or_create_session_existing(mock_session):
    svc = SessionService()
    repo = MagicMock()
    repo.get_active_by_vehicle_id = AsyncMock(return_value=mock_session)
    svc._repo = repo

    result = await svc.get_or_create_session("ABC-1234")
    assert result.session_id == "ses-001"
    repo.create.assert_not_called()


@pytest.mark.asyncio
async def test_transition_to_inside(mock_session):
    svc = SessionService()
    repo = MagicMock()
    repo.get_active_by_vehicle_id = AsyncMock(return_value=mock_session)
    repo.update = AsyncMock(return_value=mock_session)
    svc._repo = repo

    result = await svc.transition_to_inside("ABC-1234")
    assert result.current_state == "INSIDE"
    assert result.last_entry_time is not None


@pytest.mark.asyncio
async def test_transition_to_inside_already_inside(mock_inside_session):
    svc = SessionService()
    repo = MagicMock()
    repo.get_active_by_vehicle_id = AsyncMock(return_value=mock_inside_session)
    svc._repo = repo

    with pytest.raises(SessionError, match="already INSIDE"):
        await svc.transition_to_inside("ABC-1234")


@pytest.mark.asyncio
async def test_transition_to_outside(mock_inside_session):
    svc = SessionService()
    repo = MagicMock()
    repo.get_active_by_vehicle_id = AsyncMock(return_value=mock_inside_session)
    repo.update = AsyncMock(return_value=mock_inside_session)
    svc._repo = repo

    result = await svc.transition_to_outside("ABC-1234")
    assert result.current_state == "OUTSIDE"
    assert result.last_exit_time is not None


@pytest.mark.asyncio
async def test_transition_to_outside_already_outside(mock_session):
    svc = SessionService()
    repo = MagicMock()
    repo.get_active_by_vehicle_id = AsyncMock(return_value=mock_session)
    svc._repo = repo

    with pytest.raises(SessionError, match="already OUTSIDE"):
        await svc.transition_to_outside("ABC-1234")


# ── EntryService ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_process_entry_success(mock_session, mock_txn):
    svc = EntryService()
    svc._sessions.get_or_create_session = AsyncMock(return_value=mock_session)
    svc._sessions.transition_to_inside = AsyncMock(return_value=mock_session)
    svc._transactions.create_transaction = AsyncMock(return_value=mock_txn)

    session, txn = await svc.process_entry(
        vehicle_id="ABC-1234", decision="GRANT",
    )
    assert session.session_id == "ses-001"
    assert txn.action == "ENTRY"


@pytest.mark.asyncio
async def test_process_entry_not_grant():
    svc = EntryService()
    with pytest.raises(EntryError, match="only GRANT allowed"):
        await svc.process_entry(vehicle_id="ABC-1234", decision="DENY")


@pytest.mark.asyncio
async def test_process_entry_duplicate(mock_inside_session):
    svc = EntryService()
    svc._sessions.get_or_create_session = AsyncMock(
        return_value=mock_inside_session
    )

    with pytest.raises(EntryError, match="already INSIDE"):
        await svc.process_entry(vehicle_id="ABC-1234", decision="GRANT")


# ── ExitService ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_process_exit_success(mock_inside_session, mock_txn):
    mock_txn.action = "EXIT"
    svc = ExitService()
    svc._sessions.get_session = AsyncMock(return_value=mock_inside_session)
    svc._sessions.transition_to_outside = AsyncMock(
        return_value=mock_inside_session
    )
    svc._transactions.create_transaction = AsyncMock(return_value=mock_txn)

    session, txn = await svc.process_exit(
        vehicle_id="ABC-1234", decision="GRANT",
    )
    assert session.session_id == "ses-001"
    assert txn.action == "EXIT"


@pytest.mark.asyncio
async def test_process_exit_not_grant():
    svc = ExitService()
    with pytest.raises(ExitError, match="only GRANT allowed"):
        await svc.process_exit(vehicle_id="ABC-1234", decision="MANUAL_REVIEW")


@pytest.mark.asyncio
async def test_process_exit_no_session():
    svc = ExitService()
    svc._sessions.get_session = AsyncMock(return_value=None)

    with pytest.raises(ExitError, match="No active session"):
        await svc.process_exit(vehicle_id="ABC-1234", decision="GRANT")


@pytest.mark.asyncio
async def test_process_exit_already_outside(mock_session):
    svc = ExitService()
    svc._sessions.get_session = AsyncMock(return_value=mock_session)

    with pytest.raises(ExitError, match="not INSIDE"):
        await svc.process_exit(vehicle_id="ABC-1234", decision="GRANT")


# ── TransactionService ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_transaction(mock_txn):
    svc = TransactionService()
    repo = MagicMock()
    repo.create = AsyncMock(return_value=mock_txn)
    svc._repo = repo

    result = await svc.create_transaction(
        session_id="ses-001", vehicle_id="ABC-1234",
        action="ENTRY", decision="GRANT",
    )
    assert result.transaction_id == "txn-001"


# ── WorkflowService ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_workflow_entry_success(mock_session, mock_txn):
    svc = WorkflowService()
    svc._entry.process_entry = AsyncMock(
        return_value=(mock_session, mock_txn)
    )

    result = await svc.run_entry_workflow(
        vehicle_id="ABC-1234", decision="GRANT",
    )
    assert result.success is True
    assert result.action == "ENTRY"
    assert result.session is not None
    assert result.transaction is not None


@pytest.mark.asyncio
async def test_workflow_entry_failure():
    svc = WorkflowService()
    svc._entry.process_entry = AsyncMock(
        side_effect=EntryError("Duplicate entry")
    )

    result = await svc.run_entry_workflow(
        vehicle_id="ABC-1234", decision="GRANT",
    )
    assert result.success is False
    assert result.error is not None


@pytest.mark.asyncio
async def test_workflow_exit_success(mock_inside_session, mock_txn):
    mock_txn.action = "EXIT"
    svc = WorkflowService()
    svc._exit.process_exit = AsyncMock(
        return_value=(mock_inside_session, mock_txn)
    )

    result = await svc.run_exit_workflow(
        vehicle_id="ABC-1234", decision="GRANT",
    )
    assert result.success is True
    assert result.action == "EXIT"


@pytest.mark.asyncio
async def test_workflow_exit_failure():
    svc = WorkflowService()
    svc._exit.process_exit = AsyncMock(
        side_effect=ExitError("No active session")
    )

    result = await svc.run_exit_workflow(
        vehicle_id="ABC-1234", decision="GRANT",
    )
    assert result.success is False
    assert result.error is not None
