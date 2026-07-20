import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

from app.services.ai.orchestrator.pipeline_result import PipelineResult
from app.services.decision.confidence_fusion import ConfidenceFusion, FusionResult
from app.services.decision.evidence import Evidence
from app.services.decision.evidence_collector import EvidenceCollector
from app.services.decision.explanation_builder import ExplanationBuilder
from app.services.decision.rule_engine import Decision, RuleEngine, RuleResult
from app.services.identity.verification_service import VerificationService

logger = logging.getLogger(__name__)


@dataclass
class DecisionOutput:
    request_id: str
    decision: Decision
    overall_confidence: float
    explanation: str
    evidence: list[dict]
    fusion_breakdown: dict
    triggered_rules: list[str]
    processing_time: float
    identity_verification: Optional[dict] = None
    created_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict:
        d = {
            "request_id": self.request_id,
            "decision": self.decision.value,
            "overall_confidence": self.overall_confidence,
            "explanation": self.explanation,
            "evidence": self.evidence,
            "fusion_breakdown": self.fusion_breakdown,
            "triggered_rules": self.triggered_rules,
            "processing_time": round(self.processing_time, 2),
            "created_at": self.created_at,
        }
        if self.identity_verification:
            d["identity_verification"] = self.identity_verification
        return d


class DecisionEngine:
    def __init__(
        self,
        evidence_collector: Optional[EvidenceCollector] = None,
        fusion_engine: Optional[ConfidenceFusion] = None,
        rule_engine: Optional[RuleEngine] = None,
        explanation_builder: Optional[ExplanationBuilder] = None,
        verification_service: Optional[VerificationService] = None,
    ):
        self._collector = evidence_collector or EvidenceCollector()
        self._fusion = fusion_engine or ConfidenceFusion()
        self._rules = rule_engine or RuleEngine()
        self._explainer = explanation_builder or ExplanationBuilder()
        self._verification = verification_service

    async def evaluate_result(
        self, result: PipelineResult,
    ) -> DecisionOutput:
        import time
        start = time.perf_counter()

        evidence_list = self._collector.collect(result)
        fusion = self._fusion.fuse(evidence_list)
        rule_result = self._rules.evaluate(evidence_list, fusion)
        explanation = self._explainer.build(
            evidence_list, fusion, rule_result,
        )

        identity_verification = None
        if self._verification:
            identity_verification = await self._run_verification(result)

        elapsed = (time.perf_counter() - start) * 1000

        return DecisionOutput(
            request_id=result.request_id,
            decision=rule_result.decision,
            overall_confidence=fusion.overall_confidence,
            explanation=explanation,
            evidence=[e.to_dict() for e in evidence_list],
            fusion_breakdown=fusion.breakdown,
            triggered_rules=rule_result.triggered_rules,
            processing_time=elapsed,
            identity_verification=identity_verification,
        )

    async def evaluate_evidence(
        self, evidence_list: list[Evidence],
    ) -> DecisionOutput:
        import time
        start = time.perf_counter()

        fusion = self._fusion.fuse(evidence_list)
        rule_result = self._rules.evaluate(evidence_list, fusion)
        explanation = self._explainer.build(
            evidence_list, fusion, rule_result,
        )

        elapsed = (time.perf_counter() - start) * 1000

        return DecisionOutput(
            request_id="direct",
            decision=rule_result.decision,
            overall_confidence=fusion.overall_confidence,
            explanation=explanation,
            evidence=[e.to_dict() for e in evidence_list],
            fusion_breakdown=fusion.breakdown,
            triggered_rules=rule_result.triggered_rules,
            processing_time=elapsed,
        )

    async def _run_verification(
        self, result: PipelineResult,
    ) -> dict:
        plate_text = None
        if result.recognized_plates:
            plate_text = result.recognized_plates[0].get("plate")

        face_embedding = None
        if result.face_recognitions:
            face_embedding = result.face_recognitions[0].get("embedding")

        vehicle_embedding = None
        if result.vehicle_fingerprints:
            vehicle_embedding = result.vehicle_fingerprints[0].get("embedding")

        if not plate_text:
            return {"plate_found": False, "reason": "No plate text available"}

        v_result = await self._verification.verify(
            plate_text=plate_text,
            face_embedding=face_embedding,
            vehicle_embedding=vehicle_embedding,
        )
        return v_result.to_dict()

    @property
    def fusion_engine(self) -> ConfidenceFusion:
        return self._fusion

    @property
    def rule_engine(self) -> RuleEngine:
        return self._rules

    def get_rules_config(self) -> dict:
        return {
            "weights": self._fusion.weights,
            "thresholds": {
                "ocr": self._rules._ocr_threshold,
                "face": self._rules._face_threshold,
                "vehicle": self._rules._vehicle_threshold,
            },
        }
