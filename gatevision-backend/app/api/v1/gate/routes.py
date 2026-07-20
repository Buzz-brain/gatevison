import logging

from fastapi import APIRouter, HTTPException, Query

from app.models.gate_session import GateSession
from app.models.gate_transaction import GateTransaction
from app.schemas.gate import (
    EntryRequest,
    ExitRequest,
    GateStatisticsResponse,
    GateTransactionResponse,
)
from app.services.gate.audit_service import AuditService
from app.services.gate.entry_service import EntryError, EntryService
from app.services.gate.exit_service import ExitError, ExitService
from app.services.gate.session_service import SessionService
from app.services.gate.transaction_service import TransactionService
from app.services.gate.workflow_service import WorkflowService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/gate", tags=["Gate"])

ENTRY_SVC = EntryService()
EXIT_SVC = ExitService()
SESSION_SVC = SessionService()
TXN_SVC = TransactionService()
AUDIT_SVC = AuditService()
WORKFLOW_SVC = WorkflowService()


@router.post("/entry")
async def gate_entry(body: EntryRequest):
    try:
        result = await WORKFLOW_SVC.run_entry_workflow(
            vehicle_id=body.vehicle_id,
            decision=body.decision,
            request_id=body.request_id,
            driver_id=body.driver_id,
            gate_name=body.gate_name,
            notes=body.notes,
        )
        if not result.success:
            raise HTTPException(status_code=400, detail=result.error)
        return {
            "success": True,
            "message": result.message,
            "data": {
                "session": result.session,
                "transaction": result.transaction,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Entry workflow error")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/exit")
async def gate_exit(body: ExitRequest):
    try:
        result = await WORKFLOW_SVC.run_exit_workflow(
            vehicle_id=body.vehicle_id,
            decision=body.decision,
            request_id=body.request_id,
            driver_id=body.driver_id,
            gate_name=body.gate_name,
            notes=body.notes,
        )
        if not result.success:
            raise HTTPException(status_code=400, detail=result.error)
        return {
            "success": True,
            "message": result.message,
            "data": {
                "session": result.session,
                "transaction": result.transaction,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Exit workflow error")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{vehicle_id}")
async def get_session(vehicle_id: str):
    session = await SESSION_SVC.get_session(vehicle_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "success": True,
        "message": "Session retrieved",
        "data": {
            "session_id": session.session_id,
            "vehicle_id": session.vehicle_id,
            "current_state": session.current_state,
            "last_entry_time": (
                session.last_entry_time.isoformat()
                if session.last_entry_time else None
            ),
            "last_exit_time": (
                session.last_exit_time.isoformat()
                if session.last_exit_time else None
            ),
            "active": session.active,
            "created_at": session.created_at.isoformat(),
            "updated_at": session.updated_at.isoformat(),
        },
    }


@router.get("/transactions")
async def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    txns = await TXN_SVC.get_all_transactions(skip=skip, limit=limit)
    return {
        "success": True,
        "message": "Transactions retrieved",
        "data": {
            "results": [
                {
                    "transaction_id": t.transaction_id,
                    "session_id": t.session_id,
                    "vehicle_id": t.vehicle_id,
                    "driver_id": t.driver_id,
                    "action": t.action,
                    "decision": t.decision,
                    "timestamp": t.timestamp.isoformat(),
                    "request_id": t.request_id,
                    "gate_name": t.gate_name,
                    "notes": t.notes,
                }
                for t in txns
            ],
            "total": len(txns),
        },
    }


@router.get("/active")
async def get_active_sessions():
    sessions = await AUDIT_SVC.get_active_sessions()
    return {
        "success": True,
        "message": "Active sessions retrieved",
        "data": {"sessions": sessions, "total": len(sessions)},
    }


@router.get("/history/{vehicle_id}")
async def get_vehicle_history(
    vehicle_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    history = await AUDIT_SVC.get_session_history(
        vehicle_id, skip=skip, limit=limit,
    )
    return {
        "success": True,
        "message": "Vehicle history retrieved",
        "data": history,
    }


@router.get("/statistics")
async def get_statistics():
    stats = await AUDIT_SVC.get_statistics()
    return {
        "success": True,
        "message": "Gate statistics retrieved",
        "data": stats,
    }
