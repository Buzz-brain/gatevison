import logging
import re
from dataclasses import dataclass, field
from typing import Optional

from app.config.settings import settings
from app.models.gate_session import GateSession
from app.repositories.gate_session_repository import GateSessionRepository
from app.services.ai.embedding.similarity_engine import SimilarityEngine

logger = logging.getLogger(__name__)


@dataclass
class MatchResult:
    matched: bool = False
    session: Optional[GateSession] = None
    score: float = 0.0
    plate_score: float = 0.0
    vehicle_score: Optional[float] = None
    face_score: Optional[float] = None
    reason: str = ""
    candidates: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "matched": self.matched,
            "session_id": self.session.session_id if self.session else None,
            "vehicle_id": self.session.vehicle_id if self.session else None,
            "score": round(self.score, 3),
            "plate_score": round(self.plate_score, 3),
            "vehicle_score": (
                round(self.vehicle_score, 3)
                if self.vehicle_score is not None else None
            ),
            "face_score": (
                round(self.face_score, 3)
                if self.face_score is not None else None
            ),
            "reason": self.reason,
            "candidates": self.candidates,
        }


class ActiveSessionMatcher:
    """Finds the best active (INSIDE) session for a vehicle leaving the gate.

    Matching uses the recognized plate as the primary signal and the vehicle /
    face embeddings captured at entry as secondary confirmation. If the plate
    no longer matches (e.g. OCR error on exit) the embedding signals can still
    confirm the session via the fallback threshold.
    """

    def __init__(
        self,
        plate_weight: Optional[float] = None,
        vehicle_weight: Optional[float] = None,
        face_weight: Optional[float] = None,
        threshold: Optional[float] = None,
        embedding_fallback_threshold: Optional[float] = None,
    ):
        self._plate_weight = (
            plate_weight or settings.SESSION_MATCH_PLATE_WEIGHT
        )
        self._vehicle_weight = (
            vehicle_weight or settings.SESSION_MATCH_VEHICLE_WEIGHT
        )
        self._face_weight = face_weight or settings.SESSION_MATCH_FACE_WEIGHT
        self._threshold = threshold or settings.SESSION_MATCH_THRESHOLD
        self._fallback = (
            embedding_fallback_threshold
            or settings.SESSION_MATCH_EMBEDDING_FALLBACK_THRESHOLD
        )
        self._similarity = SimilarityEngine()
        self._repo = GateSessionRepository()

    @staticmethod
    def _normalize_plate(plate: str) -> str:
        return re.sub(r"[^A-Z0-9]", "", plate.upper())

    async def find_best_match(
        self,
        plate_text: str,
        vehicle_embedding: Optional[list[float]] = None,
        face_embedding: Optional[list[float]] = None,
    ) -> MatchResult:
        sessions = await self._repo.get_vehicles_inside()
        if not sessions:
            return MatchResult(reason="No active sessions to match")

        query_plate = self._normalize_plate(plate_text or "")
        candidates: list[dict] = []

        for s in sessions:
            entry_plate = self._normalize_plate(s.plate_text or s.vehicle_id or "")
            plate_score = 1.0 if entry_plate == query_plate else 0.0

            vehicle_score = None
            if vehicle_embedding and s.vehicle_embedding:
                vehicle_score = self._similarity.cosine_similarity(
                    vehicle_embedding, s.vehicle_embedding,
                )

            face_score = None
            if face_embedding and s.face_embedding:
                face_score = self._similarity.cosine_similarity(
                    face_embedding, s.face_embedding,
                )

            score = self._combined_score(
                plate_score, vehicle_score, face_score,
            )
            embedding_score = self._embedding_only_score(
                vehicle_score, face_score,
            )
            candidates.append({
                "session_id": s.session_id,
                "vehicle_id": s.vehicle_id,
                "plate_score": round(plate_score, 3),
                "vehicle_score": (
                    round(vehicle_score, 3)
                    if vehicle_score is not None else None
                ),
                "face_score": (
                    round(face_score, 3)
                    if face_score is not None else None
                ),
                "score": round(score, 3),
                "embedding_score": round(embedding_score, 3),
            })

        candidates.sort(key=lambda c: c["score"], reverse=True)
        best = candidates[0]
        best_session = next(
            (s for s in sessions if s.session_id == best["session_id"]), None
        )

        matched = self._is_match(best, query_plate)
        if matched:
            reason = "Exact plate match on active session"
            if best["plate_score"] == 0.0:
                reason = "Embedding match on active session (plate differs)"
        else:
            reason = "No active session matched within threshold"

        return MatchResult(
            matched=matched,
            session=best_session,
            score=best["score"],
            plate_score=best["plate_score"],
            vehicle_score=best.get("vehicle_score"),
            face_score=best.get("face_score"),
            reason=reason,
            candidates=candidates,
        )

    def _combined_score(
        self,
        plate_score: float,
        vehicle_score: Optional[float],
        face_score: Optional[float],
    ) -> float:
        available: list[tuple[float, float]] = [
            (self._plate_weight, plate_score),
        ]
        if vehicle_score is not None:
            available.append((self._vehicle_weight, vehicle_score))
        if face_score is not None:
            available.append((self._face_weight, face_score))

        total_weight = sum(w for w, _ in available)
        if total_weight <= 0:
            return 0.0
        return sum(w * s for w, s in available) / total_weight

    def _embedding_only_score(
        self,
        vehicle_score: Optional[float],
        face_score: Optional[float],
    ) -> float:
        available: list[tuple[float, float]] = []
        if vehicle_score is not None:
            available.append((self._vehicle_weight, vehicle_score))
        if face_score is not None:
            available.append((self._face_weight, face_score))

        if not available:
            return 0.0
        total_weight = sum(w for w, _ in available)
        return sum(w * s for w, s in available) / total_weight

    def _is_match(self, candidate: dict, query_plate: str) -> bool:
        if query_plate and candidate["plate_score"] == 1.0:
            return True
        if candidate.get("embedding_score", 0.0) >= self._fallback:
            return True
        return False
