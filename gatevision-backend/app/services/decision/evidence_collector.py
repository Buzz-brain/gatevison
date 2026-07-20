import logging
from typing import Optional

from app.services.ai.orchestrator.pipeline_result import PipelineResult
from app.services.decision.evidence import Evidence

logger = logging.getLogger(__name__)


class EvidenceCollector:
    def collect(self, result: PipelineResult) -> list[Evidence]:
        evidence_list: list[Evidence] = []

        plate_evidence = self._build_plate_evidence(result)
        if plate_evidence:
            evidence_list.append(plate_evidence)

        ocr_evidence = self._build_ocr_evidence(result)
        if ocr_evidence:
            evidence_list.append(ocr_evidence)

        face_evidence = self._build_face_evidence(result)
        if face_evidence:
            evidence_list.append(face_evidence)

        vehicle_evidence = self._build_vehicle_evidence(result)
        if vehicle_evidence:
            evidence_list.append(vehicle_evidence)

        return evidence_list

    def _build_plate_evidence(
        self, result: PipelineResult,
    ) -> Optional[Evidence]:
        if not result.detected_plates:
            return Evidence(
                module_name="plate_detection",
                confidence=0.0,
                matched=False,
                score=None,
                metadata={"detections": [], "reason": "No plates detected"},
            )

        best = max(result.detected_plates, key=lambda d: d.get("confidence", 0))
        return Evidence(
            module_name="plate_detection",
            confidence=best.get("confidence", 0.0),
            matched=best.get("confidence", 0) > 0,
            score=best.get("confidence"),
            metadata=best,
        )

    def _build_ocr_evidence(self, result: PipelineResult) -> Optional[Evidence]:
        if not result.recognized_plates:
            return Evidence(
                module_name="ocr",
                confidence=0.0,
                matched=False,
                score=None,
                metadata={"plates": [], "reason": "No plates recognized"},
            )

        best = max(
            result.recognized_plates,
            key=lambda r: r.get("confidence", 0),
        )
        return Evidence(
            module_name="ocr",
            confidence=best.get("confidence", 0.0),
            matched=best.get("validation_status") == "validated",
            score=best.get("confidence"),
            metadata=best,
        )

    def _build_face_evidence(self, result: PipelineResult) -> Optional[Evidence]:
        if not result.face_recognitions:
            return None

        combined = result.face_recognitions[0]
        score = combined.get("similarity_score")
        matched = combined.get("matched", False)
        confidence = score if score is not None else (1.0 if matched else 0.0)

        return Evidence(
            module_name="face_recognition",
            confidence=confidence,
            matched=matched,
            score=score,
            metadata=combined,
        )

    def _build_vehicle_evidence(self, result: PipelineResult) -> Optional[Evidence]:
        if not result.vehicle_fingerprints:
            return None

        combined = result.vehicle_fingerprints[0]
        score = None
        matched = result.vehicle_detections[0]["detected"] if result.vehicle_detections else False
        confidence = 1.0 if matched else 0.0

        return Evidence(
            module_name="vehicle_fingerprint",
            confidence=confidence,
            matched=matched,
            score=score,
            metadata=combined,
        )
