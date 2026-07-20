import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.decision_record import DecisionRecord
from app.repositories.decision_repository import DecisionRepository
from app.schemas.decision import (
    DecisionHistoryResponse,
    DecisionResponse,
    DecisionRulesResponse,
    DecisionStatisticsResponse,
    EvidenceSchema,
)
from app.services.decision.decision_engine import DecisionEngine
from app.services.decision.evidence import Evidence

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/decision", tags=["Decision"])

ENGINE = DecisionEngine()
REPO = DecisionRepository()


@router.post("/evaluate")
async def evaluate_decision(evidence_list: list[EvidenceSchema]):
    import traceback
    try:
        evidence_objects = [
            Evidence(
                module_name=e.module_name,
                confidence=e.confidence,
                matched=e.matched,
                score=e.score,
                metadata=e.metadata,
                processing_time=e.processing_time,
            )
            for e in evidence_list
        ]
        output = await ENGINE.evaluate_evidence(evidence_objects)

        record = DecisionRecord(
            request_id=output.request_id,
            overall_confidence=output.overall_confidence,
            decision=output.decision.value,
            explanation=output.explanation,
            evidence=output.evidence,
            fusion_breakdown=output.fusion_breakdown,
            triggered_rules=output.triggered_rules,
            processing_time=output.processing_time,
        )
        await REPO.create(record)

        return {
            "success": True,
            "message": "Decision evaluated",
            "data": output.to_dict(),
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=traceback.format_exc())


@router.get("/history")
async def decision_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    records = await REPO.get_all(skip=skip, limit=limit)
    return {
        "success": True,
        "message": "Decision history retrieved",
        "data": {
            "results": [
                DecisionHistoryResponse(
                    _id=str(r.id),
                    request_id=r.request_id,
                    decision=r.decision,
                    overall_confidence=r.overall_confidence,
                    explanation=r.explanation,
                    processing_time=r.processing_time,
                    created_at=r.created_at,
                )
                for r in records
            ],
            "total": len(records),
            "skip": skip,
            "limit": limit,
        },
    }


@router.get("/statistics")
async def decision_statistics():
    stats = await REPO.statistics()
    return {
        "success": True,
        "message": "Decision statistics retrieved",
        "data": DecisionStatisticsResponse(**stats),
    }


@router.get("/rules")
async def decision_rules():
    config = ENGINE.get_rules_config()
    return {
        "success": True,
        "message": "Decision rules retrieved",
        "data": DecisionRulesResponse(**config),
    }


@router.get("/{record_id}")
async def get_decision(record_id: str):
    record = await REPO.get_by_id(record_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Decision not found")
    return {
        "success": True,
        "message": "Decision retrieved",
        "data": DecisionResponse(
            _id=str(record.id),
            request_id=record.request_id,
            decision=record.decision,
            overall_confidence=record.overall_confidence,
            explanation=record.explanation,
            evidence=record.evidence,
            fusion_breakdown=record.fusion_breakdown,
            triggered_rules=record.triggered_rules,
            processing_time=record.processing_time,
            created_at=record.created_at,
        ),
    }
