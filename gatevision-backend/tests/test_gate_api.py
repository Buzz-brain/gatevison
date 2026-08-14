from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.gate.routes import (
    ENTRY_SVC,
    EXIT_SVC,
    SESSION_SVC,
    TXN_SVC,
    AUDIT_SVC,
    WORKFLOW_SVC,
    router,
)


@pytest.fixture(autouse=True)
def mock_workflow():
    WORKFLOW_SVC.run_session_entry = AsyncMock(
        return_value=MagicMock(
            success=True,
            action="ENTRY",
            vehicle_id="ABC-1234",
            message="Entry session created",
            session={
                "session_id": "ses-001",
                "vehicle_id": "ABC-1234",
                "current_state": "INSIDE",
            },
            transaction={
                "transaction_id": "txn-001",
                "action": "ENTRY",
                "decision": "GRANT",
            },
            error=None,
        )
    )
    WORKFLOW_SVC.run_session_exit = AsyncMock(
        return_value=MagicMock(
            success=True,
            action="EXIT",
            vehicle_id="ABC-1234",
            message="Exit session validated",
            session={
                "session_id": "ses-001",
                "vehicle_id": "ABC-1234",
                "current_state": "OUTSIDE",
            },
            transaction={
                "transaction_id": "txn-002",
                "action": "EXIT",
                "decision": "GRANT",
            },
            error=None,
        )
    )


@pytest.fixture(autouse=True)
def mock_session_and_audit():
    SESSION_SVC.get_session = AsyncMock(
        return_value=MagicMock(
            session_id="ses-001",
            vehicle_id="ABC-1234",
            current_state="INSIDE",
            active=True,
            last_entry_time=None,
            last_exit_time=None,
            created_at=MagicMock(isoformat=MagicMock(return_value="2024-01-01T00:00:00")),
            updated_at=MagicMock(isoformat=MagicMock(return_value="2024-01-01T00:00:00")),
        )
    )

    TXN_SVC.get_all_transactions = AsyncMock(
        return_value=[
            MagicMock(
                transaction_id="txn-001",
                session_id="ses-001",
                vehicle_id="ABC-1234",
                driver_id=None,
                action="ENTRY",
                decision="GRANT",
                timestamp=MagicMock(isoformat=MagicMock(return_value="2024-01-01T00:00:00")),
                request_id="req-001",
                gate_name="Main Gate",
                notes=None,
            ),
            MagicMock(
                transaction_id="txn-002",
                session_id="ses-001",
                vehicle_id="ABC-1234",
                driver_id=None,
                action="EXIT",
                decision="GRANT",
                timestamp=MagicMock(isoformat=MagicMock(return_value="2024-01-01T00:01:00")),
                request_id="req-002",
                gate_name="Main Gate",
                notes=None,
            ),
        ]
    )

    AUDIT_SVC.get_active_sessions = AsyncMock(
        return_value=[
            {
                "session_id": "ses-001",
                "vehicle_id": "ABC-1234",
                "current_state": "INSIDE",
                "active": True,
            }
        ]
    )
    AUDIT_SVC.get_session_history = AsyncMock(
        return_value={
            "session": {
                "session_id": "ses-001",
                "vehicle_id": "ABC-1234",
                "current_state": "INSIDE",
            },
            "transactions": [
                {
                    "transaction_id": "txn-001",
                    "action": "ENTRY",
                    "decision": "GRANT",
                }
            ],
        }
    )
    AUDIT_SVC.get_statistics = AsyncMock(
        return_value={
            "vehicles_inside": 1,
            "vehicles_outside": 0,
            "total_sessions": 1,
            "total_transactions": 2,
            "entries": 1,
            "exits": 1,
            "today_transactions": 2,
        }
    )


@pytest.fixture(autouse=True)
def mock_models():
    with patch("app.api.v1.gate.routes.GateSession") as mock_gs, \
         patch("app.api.v1.gate.routes.GateTransaction") as mock_gt:
        mock_gs.return_value = MagicMock()
        mock_gt.return_value = MagicMock()
        yield


@pytest.fixture
def app():
    application = FastAPI()
    application.include_router(router)
    return application


def test_routes_import():
    assert router is not None


# ── Entry ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_entry_success(app):
    transport = ASGITransport(app=app)
    payload = {
        "request_id": "req-001",
        "vehicle_id": "ABC-1234",
        "decision": "GRANT",
    }
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/gate/entry", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["session"]["current_state"] == "INSIDE"
        assert data["data"]["transaction"]["action"] == "ENTRY"


@pytest.mark.asyncio
async def test_entry_rejected(app):
    WORKFLOW_SVC.run_session_entry = AsyncMock(
        return_value=MagicMock(
            success=False,
            action="ENTRY",
            vehicle_id="ABC-1234",
            message="Entry rejected",
            error="Decision is 'DENY', not GRANT",
            session=None,
            transaction=None,
        )
    )
    transport = ASGITransport(app=app)
    payload = {
        "request_id": "req-001",
        "vehicle_id": "ABC-1234",
        "decision": "DENY",
    }
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/gate/entry", json=payload)
        assert resp.status_code == 400


# ── Exit ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_exit_success(app):
    transport = ASGITransport(app=app)
    payload = {
        "request_id": "req-002",
        "vehicle_id": "ABC-1234",
        "decision": "GRANT",
    }
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/gate/exit", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["session"]["current_state"] == "OUTSIDE"
        assert data["data"]["transaction"]["action"] == "EXIT"


@pytest.mark.asyncio
async def test_exit_rejected(app):
    WORKFLOW_SVC.run_session_exit = AsyncMock(
        return_value=MagicMock(
            success=False,
            action="EXIT",
            vehicle_id="ABC-1234",
            message="Exit rejected",
            error="No active session matched",
            session=None,
            transaction=None,
        )
    )
    transport = ASGITransport(app=app)
    payload = {
        "request_id": "req-002",
        "vehicle_id": "ABC-1234",
        "decision": "GRANT",
    }
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/gate/exit", json=payload)
        assert resp.status_code == 400


# ── Session ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_session(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/gate/session/ABC-1234")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["current_state"] == "INSIDE"


@pytest.mark.asyncio
async def test_get_session_not_found(app):
    SESSION_SVC.get_session = AsyncMock(return_value=None)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/gate/session/NONEXIST")
        assert resp.status_code == 404


# ── Transactions ────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_transactions(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/gate/transactions")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert len(data["data"]["results"]) == 2


# ── Active ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_active_sessions(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/gate/active")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert len(data["data"]["sessions"]) == 1


# ── History ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_vehicle_history(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/gate/history/ABC-1234")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["session"] is not None
        assert len(data["data"]["transactions"]) == 1


# ── Statistics ──────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_statistics(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/gate/statistics")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["vehicles_inside"] == 1
        assert data["data"]["total_transactions"] == 2
