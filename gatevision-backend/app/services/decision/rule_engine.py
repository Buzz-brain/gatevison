import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from app.config.settings import settings
from app.services.decision.confidence_fusion import FusionResult
from app.services.decision.evidence import Evidence

logger = logging.getLogger(__name__)


class Decision(Enum):
    GRANT = "GRANT"
    DENY = "DENY"
    MANUAL_REVIEW = "MANUAL_REVIEW"


@dataclass
class RuleResult:
    decision: Decision
    triggered_rules: list[str] = field(default_factory=list)


class RuleEngine:
    def __init__(
        self,
        ocr_threshold: Optional[float] = None,
        face_threshold: Optional[float] = None,
        vehicle_threshold: Optional[float] = None,
    ):
        self._ocr_threshold = ocr_threshold or settings.OCR_MIN_CONFIDENCE
        self._face_threshold = face_threshold or settings.FACE_SIMILARITY_THRESHOLD
        self._vehicle_threshold = (
            vehicle_threshold or settings.VEHICLE_SIMILARITY_THRESHOLD
        )

    def evaluate(
        self, evidence_list: list[Evidence], fusion: FusionResult,
    ) -> RuleResult:
        evidence_map = {e.module_name: e for e in evidence_list}
        triggered: list[str] = []

        plate_ev = evidence_map.get("plate_detection")
        ocr_ev = evidence_map.get("ocr")
        face_ev = evidence_map.get("face_recognition")
        vehicle_ev = evidence_map.get("vehicle_fingerprint")

        if plate_ev is None or not plate_ev.matched:
            triggered.append("plate_detection_failed")
            return RuleResult(decision=Decision.DENY, triggered_rules=triggered)

        vehicle_matched = vehicle_ev is not None and vehicle_ev.matched
        face_matched = face_ev is not None and face_ev.matched

        critical_failures = sum(
            1 for e in evidence_list if not e.matched and e.confidence < 0.3
        )
        if critical_failures >= 2:
            triggered.append("multiple_critical_failures")
            return RuleResult(decision=Decision.DENY, triggered_rules=triggered)

        if face_matched and vehicle_matched and (ocr_ev is None or ocr_ev.confidence < self._ocr_threshold):
            triggered.append("face_vehicle_match_weak_ocr")
            return RuleResult(
                decision=Decision.MANUAL_REVIEW, triggered_rules=triggered,
            )

        if ocr_ev is None or ocr_ev.confidence < self._ocr_threshold:
            triggered.append("ocr_below_threshold")
            return RuleResult(
                decision=Decision.MANUAL_REVIEW, triggered_rules=triggered,
            )

        if vehicle_matched and not face_matched and face_ev is not None:
            triggered.append("vehicle_match_no_face")
            return RuleResult(
                decision=Decision.MANUAL_REVIEW, triggered_rules=triggered,
            )

        if face_matched and vehicle_matched:
            triggered.append("all_evidence_passed")
            return RuleResult(decision=Decision.GRANT, triggered_rules=triggered)

        if face_matched:
            triggered.append("face_matched_vehicle_missing")
            return RuleResult(decision=Decision.GRANT, triggered_rules=triggered)

        if vehicle_matched:
            triggered.append("vehicle_matched_face_missing")
            return RuleResult(
                decision=Decision.MANUAL_REVIEW, triggered_rules=triggered,
            )

        triggered.append("default_manual_review")
        return RuleResult(
            decision=Decision.MANUAL_REVIEW, triggered_rules=triggered,
        )
