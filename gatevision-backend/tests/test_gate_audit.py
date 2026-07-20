from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.gate.audit_service import AuditService


@pytest.fixture
def mock_session():
    s = MagicMock()
    s.session_id = "ses-001"
    s.vehicle_id = "ABC-1234"
    s.current_state = "INSIDE"
    s.active = True
    s.last_entry_time = None
    s.last_exit_time = None
    s.created_at = MagicMock(isoformat=MagicMock(return_value="2024-01-01T00:00:00"))
    s.updated_at = MagicMock(isoformat=MagicMock(return_value="2024-01-01T00:00:00"))
    return s


@pytest.fixture
def mock_txn():
    t = MagicMock()
    t.transaction_id = "txn-001"
    t.session_id = "ses-001"
    t.vehicle_id = "ABC-1234"
    t.driver_id = None
    t.action = "ENTRY"
    t.decision = "GRANT"
    t.request_id = "req-001"
    t.gate_name = "Main Gate"
    t.notes = None
    t.timestamp = MagicMock(isoformat=MagicMock(return_value="2024-01-01T00:00:00"))
    return t


@pytest.mark.asyncio
async def test_get_vehicles_inside(mock_session):
    svc = AuditService()
    svc._session_repo.get_vehicles_inside = AsyncMock(return_value=[mock_session])
    result = await svc.get_vehicles_inside()
    assert len(result) == 1
    assert result[0]["current_state"] == "INSIDE"


@pytest.mark.asyncio
async def test_get_vehicles_outside(mock_session):
    mock_session.current_state = "OUTSIDE"
    svc = AuditService()
    svc._session_repo.get_vehicles_outside = AsyncMock(return_value=[mock_session])
    result = await svc.get_vehicles_outside()
    assert len(result) == 1
    assert result[0]["current_state"] == "OUTSIDE"


@pytest.mark.asyncio
async def test_get_active_sessions(mock_session):
    svc = AuditService()
    svc._session_repo.get_all_active = AsyncMock(return_value=[mock_session])
    result = await svc.get_active_sessions()
    assert len(result) == 1
    assert result[0]["session_id"] == "ses-001"


@pytest.mark.asyncio
async def test_get_session_history(mock_session, mock_txn):
    svc = AuditService()
    svc._session_repo.get_active_by_vehicle_id = AsyncMock(return_value=mock_session)
    svc._txn_repo.get_by_session_id = AsyncMock(return_value=[mock_txn])
    svc._txn_repo.get_by_vehicle_id = AsyncMock(return_value=[])

    result = await svc.get_session_history("ABC-1234")
    assert result["session"] is not None
    assert len(result["transactions"]) == 1
    assert result["transactions"][0]["action"] == "ENTRY"


@pytest.mark.asyncio
async def test_get_session_history_no_session(mock_txn):
    svc = AuditService()
    svc._session_repo.get_active_by_vehicle_id = AsyncMock(return_value=None)
    svc._txn_repo.get_by_session_id = AsyncMock(return_value=[])
    svc._txn_repo.get_by_vehicle_id = AsyncMock(return_value=[mock_txn])

    result = await svc.get_session_history("NONEXIST")
    assert result["session"] is None
    assert len(result["transactions"]) == 1


@pytest.mark.asyncio
async def test_get_statistics(mock_session, mock_txn):
    svc = AuditService()
    svc._session_repo.count_inside = AsyncMock(return_value=1)
    svc._session_repo.count_outside = AsyncMock(return_value=0)
    svc._session_repo.count = AsyncMock(return_value=1)
    svc._txn_repo.statistics = AsyncMock(
        return_value={
            "total_transactions": 2,
            "entries": 1,
            "exits": 1,
        }
    )
    svc._txn_repo.count_today = AsyncMock(return_value=2)

    result = await svc.get_statistics()
    assert result["vehicles_inside"] == 1
    assert result["vehicles_outside"] == 0
    assert result["total_transactions"] == 2
    assert result["today_transactions"] == 2
