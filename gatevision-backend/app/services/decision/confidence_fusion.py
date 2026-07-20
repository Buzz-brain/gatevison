import logging
from dataclasses import dataclass, field
from typing import Optional

from app.config.settings import settings
from app.services.decision.evidence import Evidence

logger = logging.getLogger(__name__)


@dataclass
class FusionResult:
    overall_confidence: float
    module_contributions: dict = field(default_factory=dict)
    breakdown: dict = field(default_factory=dict)


class ConfidenceFusion:
    def __init__(self, weights: Optional[dict[str, float]] = None):
        self._weights = self._normalize(
            weights or {
                "plate_detection": settings.WEIGHT_PLATE,
                "ocr": settings.WEIGHT_OCR,
                "face_recognition": settings.WEIGHT_FACE,
                "vehicle_fingerprint": settings.WEIGHT_VEHICLE,
            }
        )

    @staticmethod
    def _normalize(weights: dict[str, float]) -> dict[str, float]:
        total = sum(weights.values())
        if total <= 0:
            raise ValueError("Sum of weights must be positive")
        return {k: v / total for k, v in weights.items()}

    @property
    def weights(self) -> dict[str, float]:
        return dict(self._weights)

    def fuse(self, evidence_list: list[Evidence]) -> FusionResult:
        if not evidence_list:
            return FusionResult(
                overall_confidence=0.0,
                module_contributions={},
                breakdown={"no_evidence": True},
            )

        total = 0.0
        contributions: dict[str, float] = {}
        breakdown: dict[str, dict] = {}

        for ev in evidence_list:
            w = self._weights.get(ev.module_name, 0.0)
            contribution = w * ev.confidence
            contributions[ev.module_name] = round(contribution, 4)
            total += contribution
            breakdown[ev.module_name] = {
                "weight": round(w, 4),
                "confidence": ev.confidence,
                "contribution": round(contribution, 4),
            }

        return FusionResult(
            overall_confidence=round(total, 4),
            module_contributions=contributions,
            breakdown=breakdown,
        )
