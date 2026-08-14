from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.recognition.routes import router
from app.models.decision_record import DecisionRecord


@pytest.fixture
def app():
    application = FastAPI()
    application.include_router(router)
    return application


def make_txn(transaction_id="txn-001", decision="GRANT", plate="ABC-1234", request_id="req-1"):
    txn = MagicMock()
    txn.transaction_id = transaction_id
    txn.session_id = "ses-001"
    txn.vehicle_id = plate
    txn.driver_id = "drv-1"
    txn.action = "ENTRY"
    txn.decision = decision
    txn.timestamp = __import__("datetime").datetime.utcnow()
    txn.request_id = request_id
    txn.gate_name = "Main Gate"
    txn.notes = None
    return txn


def make_session(plate="ABC-1234", confidence=0.92):
    session = MagicMock()
    session.plate_text = plate
    session.entry_confidence = {"capture_confidence": confidence}
    return session


def make_decision(
    decision="GRANT",
    request_id="req-1",
    plate="ABC-1234",
    confidence=0.92,
):
    record = MagicMock(spec=DecisionRecord)
    record.id = "dec-001"
    record.request_id = request_id
    record.decision = decision
    record.overall_confidence = confidence
    record.explanation = "All evidence passed."
    record.evidence = [
        {"module_name": "ocr", "confidence": confidence,
         "metadata": {"plate": plate}},
    ]
    record.fusion_breakdown = {"ocr": {"weight": 0.3, "confidence": confidence}}
    record.triggered_rules = ["all_evidence_passed"]
    record.processing_time = 42.0
    record.created_at = datetime.utcnow()
    return record


def make_query(records, count=None):
    query = MagicMock()
    query.sort.return_value = query
    query.skip.return_value = query
    query.limit.return_value = query
    query.to_list = AsyncMock(return_value=records)
    query.count = AsyncMock(
        return_value=len(records) if count is None else count
    )
    return query


def history_item(record, decision_ui):
    plate = record.evidence[0]["metadata"]["plate"]
    return {
        "id": str(record.id),
        "plate": plate,
        "driver": "John Doe",
        "vehicle": "Toyota Camry",
        "decision": decision_ui,
        "confidence": 92.0,
        "direction": "entry",
        "timestamp": record.created_at.isoformat(),
        "pipeline_id": record.request_id,
    }


def test_routes_import():
    assert router is not None


@pytest.mark.asyncio
async def test_history_empty(app):
    with patch(
        "app.api.v1.recognition.routes.DecisionRecord.created_at",
        MagicMock(), create=True,
    ), patch(
        "app.api.v1.recognition.routes.DecisionRecord.find_all",
        return_value=make_query([], count=0),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/recognition/history?page=1&page_size=20")
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert data["items"] == []
            assert data["total"] == 0
            assert data["total_pages"] == 0


@pytest.mark.asyncio
async def test_history_with_entries(app):
    record = make_decision()
    item = history_item(record, "granted")
    with patch(
        "app.api.v1.recognition.routes.DecisionRecord.created_at",
        MagicMock(), create=True,
    ), patch(
        "app.api.v1.recognition.routes.DecisionRecord.find_all",
        return_value=make_query([record], count=1),
    ), patch(
        "app.api.v1.recognition.routes._history_item",
        AsyncMock(return_value=item),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/recognition/history")
            assert resp.status_code == 200
            item = resp.json()["data"]["items"][0]
            assert item["plate"] == "ABC-1234"
            assert item["decision"] == "granted"
            assert item["confidence"] == 92.0
            assert item["pipeline_id"] == "req-1"


@pytest.mark.asyncio
async def test_history_decision_filter(app):
    record = make_decision(decision="DENY")
    item = history_item(record, "denied")
    find_mock = MagicMock(return_value=make_query([record], count=1))
    with patch(
        "app.api.v1.recognition.routes.DecisionRecord.created_at",
        MagicMock(), create=True,
    ), patch(
        "app.api.v1.recognition.routes.DecisionRecord.find",
        find_mock,
    ), patch(
        "app.api.v1.recognition.routes._history_item",
        AsyncMock(return_value=item),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/recognition/history?decision=denied")
            assert resp.status_code == 200
            item = resp.json()["data"]["items"][0]
            assert item["decision"] == "denied"
            find_mock.assert_called_with({"decision": "DENY"})
            assert find_mock.call_count == 2


@pytest.mark.asyncio
async def test_history_search(app):
    matching = make_decision(request_id="req-match")
    other = make_decision(request_id="req-other", plate="ZZZ-999")
    with patch(
        "app.api.v1.recognition.routes.DecisionRecord.created_at",
        MagicMock(), create=True,
    ), patch(
        "app.api.v1.recognition.routes.DecisionRecord.find_all",
        return_value=make_query([matching, other]),
    ), patch(
        "app.api.v1.recognition.routes._history_item",
        side_effect=[
            history_item(matching, "granted"),
            history_item(other, "granted"),
        ],
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/recognition/history", params={"search": "ABC"})
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert data["total"] == 1
            assert data["items"][0]["plate"] == "ABC-1234"


@pytest.mark.asyncio
async def test_result_by_transaction_id(app):
    txn = make_txn()
    with patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_transaction_id",
        AsyncMock(return_value=txn),
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_request_id",
        AsyncMock(return_value=None),
    ), patch(
        "app.api.v1.recognition.routes.GateSessionRepository.get_by_session_id",
        AsyncMock(return_value=make_session()),
    ), patch(
        "app.api.v1.recognition.routes.VehicleProfileRepository.get_by_vehicle_id",
        AsyncMock(return_value=None),
    ), patch(
        "app.api.v1.recognition.routes.DriverProfileRepository.get_by_driver_id",
        AsyncMock(return_value=None),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/recognition/result", params={"pipeline_id": "txn-001"})
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert data["id"] == "txn-001"
            assert data["ocr"]["raw_text"] == "ABC-1234"
            assert data["decision"]["decision"] == "granted"
            assert data["gate"]["gate_action"] == "open"


@pytest.mark.asyncio
async def test_result_by_request_id(app):
    txn = make_txn()
    with patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_transaction_id",
        AsyncMock(return_value=None),
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_request_id",
        AsyncMock(return_value=txn),
    ), patch(
        "app.api.v1.recognition.routes.GateSessionRepository.get_by_session_id",
        AsyncMock(return_value=make_session()),
    ), patch(
        "app.api.v1.recognition.routes.VehicleProfileRepository.get_by_vehicle_id",
        AsyncMock(return_value=None),
    ), patch(
        "app.api.v1.recognition.routes.DriverProfileRepository.get_by_driver_id",
        AsyncMock(return_value=None),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/recognition/result", params={"pipeline_id": "req-1"})
            assert resp.status_code == 200
            assert resp.json()["data"]["id"] == "txn-001"


@pytest.mark.asyncio
async def test_result_from_decision(app):
    record = make_decision(decision="DENY", request_id="req-denied", confidence=0.5)
    with patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_transaction_id",
        AsyncMock(return_value=None),
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_request_id",
        AsyncMock(return_value=None),
    ), patch(
        "app.api.v1.recognition.routes.DecisionRepository.get_by_request_id",
        AsyncMock(return_value=record),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get(
                "/recognition/result", params={"pipeline_id": "req-denied"}
            )
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert data["id"] == "dec-001"
            assert data["ocr"]["raw_text"] == "ABC-1234"
            assert data["decision"]["decision"] == "denied"
            assert data["gate"]["gate_action"] == "closed"
            assert data["pipeline_stages"][2]["status"] == "completed"


@pytest.mark.asyncio
async def test_result_not_found(app):
    with patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_transaction_id",
        AsyncMock(return_value=None),
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_request_id",
        AsyncMock(return_value=None),
    ), patch(
        "app.api.v1.recognition.routes.DecisionRepository.get_by_request_id",
        AsyncMock(return_value=None),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/recognition/result", params={"pipeline_id": "missing"})
            assert resp.status_code == 404


@pytest.mark.asyncio
async def test_models(app):
    info = {
        "name": "YOLOv8n Plate Detector",
        "loaded": True,
        "version": "8.3.87",
        "device": "cpu",
        "avg_inference_time_ms": 45.5,
    }
    with patch(
        "app.api.v1.recognition.routes.model_monitor_service.get_all_model_infos",
        return_value=[info],
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/recognition/models")
            assert resp.status_code == 200
            model = resp.json()["data"][0]
            assert model["name"] == "YOLOv8n Plate Detector"
            assert model["status"] == "healthy"
            assert model["latency_ms"] == 45.5
            assert model["gpu"] == "cpu"


@pytest.mark.asyncio
async def test_delete_history_entry_not_found(app):
    with patch(
        "app.api.v1.recognition.routes.DecisionRepository.get_by_id",
        AsyncMock(return_value=None),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.delete("/recognition/history/missing-id")
            assert resp.status_code == 200
            body = resp.json()
            assert body["success"] is False
            assert "missing-id" in body["message"]


@pytest.mark.asyncio
async def test_delete_history_entry_with_txn(app):
    record = make_decision(request_id="req-del")
    record.id = "dec-del"
    txn = make_txn(transaction_id="txn-del", request_id="req-del")
    with patch(
        "app.api.v1.recognition.routes.DecisionRepository.get_by_id",
        AsyncMock(return_value=record),
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_request_id",
        AsyncMock(return_value=txn),
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_session_id",
        AsyncMock(return_value=[txn]),
    ), patch(
        "app.api.v1.recognition.routes.GateSessionRepository.delete_by_id",
        AsyncMock(return_value=True),
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.delete_by_id",
        AsyncMock(return_value=True),
    ), patch(
        "app.api.v1.recognition.routes.DecisionRepository.delete_by_id",
        AsyncMock(return_value=True),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.delete("/recognition/history/dec-del")
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert data["deleted_record"] is True
            assert data["deleted_transaction"] is True
            assert data["deleted_session"] is True


@pytest.mark.asyncio
async def test_delete_history_entry_keeps_session_with_other_txns(app):
    record = make_decision(request_id="req-del")
    record.id = "dec-del"
    txn = make_txn(transaction_id="txn-del", request_id="req-del")
    other = make_txn(transaction_id="txn-other", request_id="req-other")
    delete_session_mock = AsyncMock(return_value=True)
    with patch(
        "app.api.v1.recognition.routes.DecisionRepository.get_by_id",
        AsyncMock(return_value=record),
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_request_id",
        AsyncMock(return_value=txn),
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.get_by_session_id",
        AsyncMock(return_value=[txn, other]),
    ), patch(
        "app.api.v1.recognition.routes.GateSessionRepository.delete_by_id",
        delete_session_mock,
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.delete_by_id",
        AsyncMock(return_value=True),
    ), patch(
        "app.api.v1.recognition.routes.DecisionRepository.delete_by_id",
        AsyncMock(return_value=True),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.delete("/recognition/history/dec-del")
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert data["deleted_session"] is False
            delete_session_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_clear_history(app):
    with patch(
        "app.api.v1.recognition.routes.DecisionRepository.delete_all",
        AsyncMock(return_value=7),
    ), patch(
        "app.api.v1.recognition.routes.GateTransactionRepository.delete_all",
        AsyncMock(return_value=5),
    ), patch(
        "app.api.v1.recognition.routes.GateSessionRepository.delete_all",
        AsyncMock(return_value=3),
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.delete("/recognition/history")
            assert resp.status_code == 200
            data = resp.json()["data"]
            assert data["deleted_records"] == 7
            assert data["deleted_transactions"] == 5
            assert data["deleted_sessions"] == 3
