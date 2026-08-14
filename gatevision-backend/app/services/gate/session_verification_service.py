import logging
from dataclasses import dataclass, field
from typing import Optional

from app.config.settings import settings
from app.services.ai.embedding.similarity_engine import SimilarityEngine

logger = logging.getLogger(__name__)


@dataclass
class SessionVerificationResult:
    mode: str = "session"
    plate_found: bool = False
    plate_text: Optional[str] = None
    plate_confidence: float = 0.0
    face_captured: bool = False
    face_confidence: float = 0.0
    vehicle_captured: bool = False
    vehicle_confidence: float = 0.0
    capture_confidence: float = 0.0
    decision: str = "MANUAL_REVIEW"
    reason: str = ""
    triggered_rules: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "mode": self.mode,
            "plate_found": self.plate_found,
            "plate_text": self.plate_text,
            "plate_confidence": round(self.plate_confidence, 3),
            "face_captured": self.face_captured,
            "face_confidence": round(self.face_confidence, 3),
            "vehicle_captured": self.vehicle_captured,
            "vehicle_confidence": round(self.vehicle_confidence, 3),
            "capture_confidence": round(self.capture_confidence, 3),
            "decision": self.decision,
            "reason": self.reason,
            "triggered_rules": self.triggered_rules,
        }


class SessionVerificationService:
    """Mode A verification: judges the quality and consistency of the signals
    captured at the gate (plate + face + vehicle) WITHOUT resolving against
    registered identities. Decision is driven by capture confidence thresholds.
    """

    def __init__(
        self,
        require_face: Optional[bool] = None,
        require_vehicle: Optional[bool] = None,
        face_min_confidence: Optional[float] = None,
        vehicle_min_confidence: Optional[float] = None,
        plate_min_confidence: Optional[float] = None,
    ):
        self._require_face = (
            require_face
            if require_face is not None
            else settings.SESSION_REQUIRE_FACE
        )
        self._require_vehicle = (
            require_vehicle
            if require_vehicle is not None
            else settings.SESSION_REQUIRE_VEHICLE
        )
        self._face_min = (
            face_min_confidence
            if face_min_confidence is not None
            else settings.SESSION_FACE_CAPTURE_MIN_CONFIDENCE
        )
        self._vehicle_min = (
            vehicle_min_confidence
            if vehicle_min_confidence is not None
            else settings.SESSION_VEHICLE_CAPTURE_MIN_CONFIDENCE
        )
        self._plate_min = (
            plate_min_confidence
            if plate_min_confidence is not None
            else settings.OCR_MIN_CONFIDENCE
        )
        self._similarity = SimilarityEngine()

    def verify_capture(
        self,
        plate_text: Optional[str],
        plate_confidence: float,
        validation_status: Optional[str] = None,
        face_embedding: Optional[list[float]] = None,
        face_confidence: Optional[float] = None,
        face_matched: Optional[bool] = None,
        face_similarity: Optional[float] = None,
        vehicle_embedding: Optional[list[float]] = None,
        vehicle_confidence: Optional[float] = None,
        vehicle_detected: Optional[bool] = None,
    ) -> SessionVerificationResult:
        rules: list[str] = []

        plate_found = bool(plate_text)
        if plate_found:
            if validation_status not in (None, "valid", "validated"):
                plate_found = False
                rules.append("plate_not_validated")
            elif plate_confidence < self._plate_min:
                plate_found = False
                rules.append("plate_confidence_below_threshold")

        plate_conf = plate_confidence if plate_found else 0.0

        face_captured, face_conf = self._resolve_capture(
            embedding=face_embedding,
            confidence=face_confidence,
            matched=face_matched,
            similarity=face_similarity,
            min_confidence=self._face_min,
        )
        if face_captured:
            rules.append("face_captured")
        else:
            rules.append("face_not_captured")

        vehicle_captured, vehicle_conf = self._resolve_capture(
            embedding=vehicle_embedding,
            confidence=vehicle_confidence,
            matched=vehicle_detected,
            similarity=None,
            min_confidence=self._vehicle_min,
        )
        if vehicle_captured:
            rules.append("vehicle_captured")
        else:
            rules.append("vehicle_not_captured")

        capture_confidence = self._fuse_confidences(
            plate_conf, face_conf, vehicle_conf,
        )

        if not plate_found:
            return SessionVerificationResult(
                plate_found=False,
                plate_text=plate_text,
                plate_confidence=plate_conf,
                face_captured=face_captured,
                face_confidence=face_conf,
                vehicle_captured=vehicle_captured,
                vehicle_confidence=vehicle_conf,
                capture_confidence=capture_confidence,
                decision="DENY" if not plate_text else "MANUAL_REVIEW",
                reason=(
                    "No plate recognized" if not plate_text
                    else "Plate unreadable or below confidence threshold"
                ),
                triggered_rules=rules,
            )

        if self._require_face and not face_captured:
            return SessionVerificationResult(
                plate_found=True,
                plate_text=plate_text,
                plate_confidence=plate_conf,
                face_captured=False,
                face_confidence=face_conf,
                vehicle_captured=vehicle_captured,
                vehicle_confidence=vehicle_conf,
                capture_confidence=capture_confidence,
                decision="MANUAL_REVIEW",
                reason="Face not captured; manual review required",
                triggered_rules=rules,
            )

        if self._require_vehicle and not vehicle_captured:
            return SessionVerificationResult(
                plate_found=True,
                plate_text=plate_text,
                plate_confidence=plate_conf,
                face_captured=face_captured,
                face_confidence=face_conf,
                vehicle_captured=False,
                vehicle_confidence=vehicle_conf,
                capture_confidence=capture_confidence,
                decision="MANUAL_REVIEW",
                reason="Vehicle fingerprint not captured; manual review required",
                triggered_rules=rules,
            )

        rules.append("session_capture_passed")
        return SessionVerificationResult(
            plate_found=True,
            plate_text=plate_text,
            plate_confidence=plate_conf,
            face_captured=face_captured,
            face_confidence=face_conf,
            vehicle_captured=vehicle_captured,
            vehicle_confidence=vehicle_conf,
            capture_confidence=capture_confidence,
            decision="GRANT",
            reason="Session verification passed: plate + face + vehicle signals captured",
            triggered_rules=rules,
        )

    async def verify_from_pipeline(
        self, result,
    ) -> SessionVerificationResult:
        plate_text = None
        plate_confidence = 0.0
        validation_status = None
        if result.recognized_plates:
            best = max(
                result.recognized_plates,
                key=lambda r: r.get("confidence", 0),
            )
            plate_text = best.get("plate")
            plate_confidence = best.get("confidence", 0.0)
            validation_status = best.get("validation_status")

        face_embedding = None
        face_confidence = None
        face_matched = None
        face_similarity = None
        if result.face_recognitions:
            fr = result.face_recognitions[0]
            face_matched = fr.get("matched", False)
            face_similarity = fr.get("similarity_score")
            if fr.get("detections"):
                det = fr["detections"][0]
                face_embedding = det.get("embedding")
                face_confidence = det.get("confidence")
            elif fr.get("face_detected"):
                face_embedding = fr.get("embedding")
                face_confidence = fr.get("face_confidence")

        vehicle_embedding = None
        vehicle_confidence = None
        vehicle_detected = None
        if result.vehicle_fingerprints:
            vf = result.vehicle_fingerprints[0]
            vehicle_embedding = vf.get("embedding")
            vehicle_confidence = vf.get("confidence")
        if result.vehicle_detections:
            vehicle_detected = result.vehicle_detections[0].get(
                "detected", False,
            )

        return self.verify_capture(
            plate_text=plate_text,
            plate_confidence=plate_confidence,
            validation_status=validation_status,
            face_embedding=face_embedding,
            face_confidence=face_confidence,
            face_matched=face_matched,
            face_similarity=face_similarity,
            vehicle_embedding=vehicle_embedding,
            vehicle_confidence=vehicle_confidence,
            vehicle_detected=vehicle_detected,
        )

    def _resolve_capture(
        self,
        embedding: Optional[list[float]],
        confidence: Optional[float],
        matched: Optional[bool],
        similarity: Optional[float],
        min_confidence: float,
    ) -> tuple[bool, float]:
        if embedding:
            conf = confidence if confidence is not None else 0.9
            return bool(conf) and conf >= min_confidence, conf
        if matched:
            conf = similarity if similarity is not None else 1.0
            return conf >= min_confidence, conf
        return False, 0.0

    def _fuse_confidences(
        self, plate_conf: float, face_conf: float, vehicle_conf: float,
    ) -> float:
        plate_weight = settings.WEIGHT_PLATE + settings.WEIGHT_OCR
        face_weight = settings.WEIGHT_FACE
        vehicle_weight = settings.WEIGHT_VEHICLE
        total = plate_weight + face_weight + vehicle_weight
        if total <= 0:
            return 0.0
        return (
            plate_conf * plate_weight
            + face_conf * face_weight
            + vehicle_conf * vehicle_weight
        ) / total
