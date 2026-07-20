import logging
from typing import Optional

from app.services.decision.confidence_fusion import FusionResult
from app.services.decision.evidence import Evidence
from app.services.decision.rule_engine import Decision, RuleResult

logger = logging.getLogger(__name__)


class ExplanationBuilder:
    def build(
        self,
        evidence_list: list[Evidence],
        fusion: FusionResult,
        rule_result: RuleResult,
    ) -> str:
        evidence_map = {e.module_name: e for e in evidence_list}
        lines: list[str] = []

        if rule_result.decision == Decision.GRANT:
            lines.append("Access Granted.")
        elif rule_result.decision == Decision.DENY:
            lines.append("Access Denied.")
        else:
            lines.append("Manual Review Required.")

        lines.append("")
        lines.append("Reason:")

        plate_ev = evidence_map.get("plate_detection")
        if plate_ev:
            pct = round(plate_ev.confidence * 100, 1)
            lines.append(
                f"  \u2022 Plate detected with {pct}% confidence."
            )

        ocr_ev = evidence_map.get("ocr")
        if ocr_ev:
            pct = round(ocr_ev.confidence * 100, 1)
            status = "validated" if ocr_ev.matched else "not validated"
            lines.append(f"  \u2022 OCR text recognition at {pct}% ({status}).")

        face_ev = evidence_map.get("face_recognition")
        if face_ev:
            if face_ev.matched:
                pct = round(face_ev.confidence * 100, 1)
                lines.append(f"  \u2022 Driver face matched authorized profile ({pct}% confidence).")
            else:
                lines.append("  \u2022 Driver face did not match authorized profile.")

        vehicle_ev = evidence_map.get("vehicle_fingerprint")
        if vehicle_ev:
            if vehicle_ev.matched:
                lines.append("  \u2022 Vehicle fingerprint matched registered vehicle.")
            else:
                lines.append("  \u2022 Vehicle fingerprint did not match registered vehicle.")

        overall = round(fusion.overall_confidence * 100, 1)
        lines.append(f"  \u2022 Overall confidence: {overall}%.")

        if rule_result.triggered_rules:
            lines.append("  \u2022 Rules triggered: " + ", ".join(rule_result.triggered_rules) + ".")

        return "\n".join(lines)
