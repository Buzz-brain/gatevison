import logging
import math
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.decision_record import DecisionRecord
from app.repositories.decision_repository import DecisionRepository
from app.repositories.driver_profile_repository import DriverProfileRepository
from app.repositories.gate_session_repository import GateSessionRepository
from app.repositories.gate_transaction_repository import GateTransactionRepository
from app.repositories.vehicle_profile_repository import VehicleProfileRepository
from app.services.system.model_monitor_service import model_monitor_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/recognition", tags=["Recognition"])

_DECISION_TO_FRONTEND = {
    "GRANT": "granted",
    "DENY": "denied",
    "MANUAL_REVIEW": "manual_review",
}

_FRONTEND_TO_DECISION = {
    "granted": "GRANT",
    "denied": "DENY",
    "manual_review": "MANUAL_REVIEW",
}


def _map_decision(decision: str) -> str:
    return _DECISION_TO_FRONTEND.get(decision.upper(), "manual_review")


def _entry_confidence_percent(session) -> float:
    """Best-effort overall recognition confidence (0-100) from a session."""
    if session is None:
        return 0.0
    conf = session.entry_confidence
    if not isinstance(conf, dict):
        return 0.0
    for key in (
        "capture_confidence",
        "plate_confidence",
        "overall_confidence",
        "vehicle_confidence",
        "face_confidence",
    ):
        value = conf.get(key)
        if isinstance(value, (int, float)):
            return round(float(value) * 100.0, 1)
    return 0.0


async def _vehicle_label(vehicle_id: str, plate_text: Optional[str]) -> str:
    profile = await VehicleProfileRepository.get_by_vehicle_id(vehicle_id)
    if profile is not None:
        parts = [p for p in (profile.make, profile.model, profile.color) if p]
        if parts:
            return " ".join(parts)
        if profile.plate_number:
            return profile.plate_number
    return plate_text or vehicle_id


async def _driver_label(driver_id: Optional[str]) -> Optional[str]:
    if not driver_id:
        return None
    profile = await DriverProfileRepository.get_by_driver_id(driver_id)
    if profile is not None:
        return profile.full_name
    return driver_id


async def _session_for_txn(txn):
    if not txn.session_id:
        return None
    return await GateSessionRepository.get_by_session_id(txn.session_id)


def _plate_from_decision(record) -> str:
    """Best-effort plate text from a decision record's OCR evidence."""
    for ev in record.evidence or []:
        if ev.get("module_name") == "ocr":
            plate = (ev.get("metadata") or {}).get("plate", "")
            if plate:
                return plate
    return ""


async def _history_item(record) -> dict:
    """Build a recognition-history row from a decision record, enriching with
    gate-transaction data when one exists (GRANT runs)."""
    plate = _plate_from_decision(record)
    txn = await GateTransactionRepository.get_by_request_id(record.request_id)
    session = await _session_for_txn(txn) if txn else None
    if txn:
        session_plate = session.plate_text if session and session.plate_text else None
        plate = plate or session_plate or txn.vehicle_id
        vehicle = await _vehicle_label(txn.vehicle_id, plate)
        driver = (
            await _driver_label(txn.driver_id)
            if txn.driver_id else "Unknown driver"
        )
        confidence = _entry_confidence_percent(session)
        direction = "exit" if str(txn.action).upper() == "EXIT" else "entry"
    else:
        vehicle = plate or "Unknown"
        driver = "Unknown driver"
        confidence = round(record.overall_confidence * 100.0, 1)
        direction = (
            "exit" if str(record.direction).lower() == "exit" else "entry"
        )

    return {
        "id": str(record.id),
        "plate": plate or "Unknown",
        "driver": driver,
        "vehicle": vehicle,
        "decision": _map_decision(record.decision),
        "confidence": confidence,
        "direction": direction,
        "timestamp": record.created_at.isoformat(),
        "pipeline_id": record.request_id,
    }


@router.delete("/history/{record_id}")
async def delete_history_entry(record_id: str):
    record = await DecisionRepository.get_by_id(record_id)
    if record is None:
        return {
            "success": False,
            "message": f"No history record '{record_id}' found",
            "data": None,
        }

    txn = await GateTransactionRepository.get_by_request_id(record.request_id)
    deleted_transaction = False
    deleted_session = False
    if txn is not None:
        if txn.session_id:
            remaining = await GateTransactionRepository.get_by_session_id(
                txn.session_id, limit=200,
            )
            remaining = [t for t in remaining if str(t.id) != str(txn.id)]
            if not remaining:
                deleted_session = await GateSessionRepository.delete_by_id(
                    txn.session_id,
                )
        deleted_transaction = await GateTransactionRepository.delete_by_id(
            str(txn.id),
        )

    deleted_record = await DecisionRepository.delete_by_id(record_id)

    return {
        "success": True,
        "message": "History entry deleted",
        "data": {
            "deleted_record": deleted_record,
            "deleted_transaction": deleted_transaction,
            "deleted_session": deleted_session,
        },
    }


@router.delete("/history")
async def clear_history():
    deleted_records = await DecisionRepository.delete_all()
    deleted_transactions = await GateTransactionRepository.delete_all()
    deleted_sessions = await GateSessionRepository.delete_all()
    return {
        "success": True,
        "message": "Recognition history cleared",
        "data": {
            "deleted_records": deleted_records,
            "deleted_transactions": deleted_transactions,
            "deleted_sessions": deleted_sessions,
        },
    }


@router.get("/history")
async def recognition_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    decision: Optional[str] = Query(None),
):
    decision_db = None
    if decision and decision.lower() != "all":
        decision_db = _FRONTEND_TO_DECISION.get(
            decision.lower(), decision.upper(),
        )

    skip = (page - 1) * page_size

    base_query = {}
    if decision_db:
        base_query["decision"] = decision_db

    def _records_query():
        return (
            DecisionRecord.find(base_query)
            if base_query else DecisionRecord.find_all()
        )

    if search:
        needle = search.strip().lower()
        cap = 1000
        records = await (
            _records_query().sort(-DecisionRecord.created_at)
            .limit(cap).to_list()
        )
        all_items = []
        for record in records:
            item = await _history_item(record)
            haystack = (
                f"{item['plate']} {item['driver']} {item['vehicle']} {item['direction']}"
            ).lower()
            if needle in haystack:
                all_items.append(item)
        total = len(all_items)
        items = all_items[skip:skip + page_size]
    else:
        records = await (
            _records_query().sort(-DecisionRecord.created_at)
            .skip(skip).limit(page_size).to_list()
        )
        total = await _records_query().count()
        items = [await _history_item(record) for record in records]

    return {
        "success": True,
        "message": "Recognition history retrieved",
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": math.ceil(total / page_size) if total else 0,
        },
    }


async def _result_from_decision(record) -> dict:
    plate = _plate_from_decision(record)
    confidence = round(record.overall_confidence * 100.0, 1)
    decision_ui = _map_decision(record.decision)
    created = record.created_at.isoformat()

    stages = [
        {"stage": "vehicle_detection", "status": "inactive", "progress": 0,
         "label": "Vehicle Detection", "duration_ms": 0,
         "started_at": created, "completed_at": None},
        {"stage": "plate_detection", "status": "inactive", "progress": 0,
         "label": "Plate Detection", "duration_ms": 0,
         "started_at": created, "completed_at": None},
        {"stage": "ocr", "status": "completed", "progress": 100,
         "label": "Plate Reading", "confidence": confidence / 100.0,
         "duration_ms": 0,
         "started_at": created, "completed_at": created},
        {"stage": "face_recognition", "status": "inactive", "progress": 0,
         "label": "Face Recognition", "duration_ms": 0,
         "started_at": created, "completed_at": None},
        {"stage": "vehicle_fingerprint", "status": "inactive", "progress": 0,
         "label": "Vehicle Fingerprint", "duration_ms": 0,
         "started_at": created, "completed_at": None},
        {"stage": "identity_verification", "status": "inactive", "progress": 0,
         "label": "Identity Verification", "duration_ms": 0,
         "started_at": created, "completed_at": None},
        {"stage": "decision", "status": "completed", "progress": 100,
         "label": "Decision", "confidence": confidence / 100.0,
         "duration_ms": 0,
         "started_at": created, "completed_at": created},
    ]

    data = {
        "id": str(record.id),
        "status": "completed",
        "image_url": "",
        "cropped_vehicle": None,
        "cropped_plate": {
            "label": "Plate",
            "confidence": confidence / 100.0,
            "resolution": "N/A",
        },
        "cropped_face": None,
        "plate_detection": None,
        "ocr": {
            "raw_text": plate,
            "cleaned_text": plate,
            "confidence": confidence / 100.0,
            "is_valid": True,
            "format": "N/A",
            "validated_at": "",
        },
        "face": None,
        "identity": None,
        "decision": {
            "decision": decision_ui,
            "confidence": confidence / 100.0,
            "reason": record.explanation or f"{decision_ui} decision",
            "explanation": record.explanation or "",
            "recommended_action": (
                "Open gate" if record.decision == "GRANT" else "Manual review"
            ),
            "evidence_summary": "",
            "rules_triggered": record.triggered_rules or [],
        },
        "explainable_ai": None,
        "evidence": record.evidence or [],
        "pipeline_stages": stages,
        "gate": {
            "gate_action": "closed",
            "session_id": None,
            "timestamp": created,
            "gate_id": "Main Gate",
        },
        "timestamps": {
            "image_captured": created,
            "plate_localized": created,
            "ocr_completed": created,
            "decision_generated": created,
            "gate_session_created": created,
        },
        "total_processing_time_ms": round(record.processing_time, 2),
        "created_at": created,
        "vehicle": {
            "detected_model": "",
            "similarity": 0,
            "reference_vehicle": plate,
            "features": [],
            "embedding_score": 0,
            "matched": False,
        },
        "face": {
            "detected": False,
            "similarity": 0,
            "embedding_distance": 0,
            "recognition_time_ms": 0,
        },
        "cropped_vehicle_label": plate,
        "driver_label": "",
    }

    return {
        "success": True,
        "message": "Recognition result retrieved",
        "data": data,
    }


@router.get("/result")
async def recognition_result(pipeline_id: str = Query(...)):
    txn = await GateTransactionRepository.get_by_transaction_id(pipeline_id)
    if txn is None:
        txn = await GateTransactionRepository.get_by_request_id(pipeline_id)
    if txn is None:
        record = await DecisionRepository.get_by_request_id(pipeline_id)
        if record is not None:
            return await _result_from_decision(record)
        raise HTTPException(
            status_code=404,
            detail=f"No recognition result for '{pipeline_id}'",
        )

    session = await _session_for_txn(txn)
    plate = (session.plate_text if session and session.plate_text else None)
    plate = plate or txn.vehicle_id
    confidence = _entry_confidence_percent(session) / 100.0
    decision_ui = _map_decision(txn.decision)
    vehicle = await _vehicle_label(txn.vehicle_id, plate)
    driver = await _driver_label(txn.driver_id) or ""

    stages = [
        {"stage": "vehicle_detection", "status": "inactive", "progress": 0,
         "label": "Vehicle Detection", "duration_ms": 0,
         "started_at": txn.timestamp.isoformat(), "completed_at": None},
        {"stage": "plate_detection", "status": "completed", "progress": 100,
         "label": "Plate Detection", "duration_ms": 0,
         "started_at": txn.timestamp.isoformat(), "completed_at": txn.timestamp.isoformat()},
        {"stage": "ocr", "status": "completed", "progress": 100,
         "label": "Plate Reading", "confidence": confidence,
         "duration_ms": 0,
         "started_at": txn.timestamp.isoformat(), "completed_at": txn.timestamp.isoformat()},
        {"stage": "face_recognition", "status": "inactive", "progress": 0,
         "label": "Face Recognition", "duration_ms": 0,
         "started_at": txn.timestamp.isoformat(), "completed_at": None},
        {"stage": "vehicle_fingerprint", "status": "inactive", "progress": 0,
         "label": "Vehicle Fingerprint", "duration_ms": 0,
         "started_at": txn.timestamp.isoformat(), "completed_at": None},
        {"stage": "identity_verification", "status": "inactive", "progress": 0,
         "label": "Identity Verification", "duration_ms": 0,
         "started_at": txn.timestamp.isoformat(), "completed_at": None},
        {"stage": "decision", "status": "completed", "progress": 100,
         "label": "Decision", "confidence": confidence,
         "duration_ms": 0,
         "started_at": txn.timestamp.isoformat(), "completed_at": txn.timestamp.isoformat()},
    ]

    data = {
        "id": txn.transaction_id,
        "status": "completed",
        "image_url": "",
        "cropped_vehicle": None,
        "cropped_plate": {
            "label": "Plate",
            "confidence": confidence,
            "resolution": "N/A",
        },
        "cropped_face": None,
        "plate_detection": None,
        "ocr": {
            "raw_text": plate,
            "cleaned_text": plate,
            "confidence": confidence,
            "is_valid": True,
            "format": "N/A",
            "validated_at": "",
        },
        "face": None,
        "identity": None,
        "decision": {
            "decision": decision_ui,
            "confidence": confidence,
            "reason": txn.notes or f"Gate {txn.action.lower()} processed",
            "explanation": f"{plate} ({txn.gate_name})",
            "recommended_action": (
                "Open gate" if txn.decision == "GRANT" else "Manual review"
            ),
            "evidence_summary": "",
            "rules_triggered": [],
        },
        "explainable_ai": None,
        "evidence": [],
        "pipeline_stages": stages,
        "gate": {
            "gate_action": "open" if txn.decision == "GRANT" else "closed",
            "session_id": txn.session_id,
            "timestamp": txn.timestamp.isoformat(),
            "gate_id": txn.gate_name,
        },
        "timestamps": {
            "image_captured": txn.timestamp.isoformat(),
            "plate_localized": txn.timestamp.isoformat(),
            "ocr_completed": txn.timestamp.isoformat(),
            "decision_generated": txn.timestamp.isoformat(),
            "gate_session_created": txn.timestamp.isoformat(),
        },
        "total_processing_time_ms": 0,
        "created_at": txn.timestamp.isoformat(),
        "vehicle": {
            "detected_model": "",
            "similarity": 0,
            "reference_vehicle": vehicle,
            "features": [],
            "embedding_score": 0,
            "matched": False,
        },
        "face": {
            "detected": False,
            "similarity": 0,
            "embedding_distance": 0,
            "recognition_time_ms": 0,
        },
        "cropped_vehicle_label": vehicle,
        "driver_label": driver,
    }

    return {
        "success": True,
        "message": "Recognition result retrieved",
        "data": data,
    }


@router.get("/models")
async def recognition_models():
    infos = model_monitor_service.get_all_model_infos()
    models = []
    for info in infos:
        models.append({
            "name": info.get("name", ""),
            "version": info.get("version", ""),
            "status": "healthy" if info.get("loaded") else "offline",
            "latency_ms": round(float(info.get("avg_inference_time_ms", 0.0)), 1),
            "gpu": info.get("device", "cpu"),
        })
    return {
        "success": True,
        "message": "Recognition models retrieved",
        "data": models,
    }
