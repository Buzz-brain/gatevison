import logging

logger = logging.getLogger(__name__)


class FaceRecognitionLogger:
    def recognition_started(self, source: str) -> None:
        logger.info(
            "Face recognition started",
            extra={"source": source, "event": "face_recognition_started"},
        )

    def face_detected(self, face_count: int) -> None:
        logger.info(
            "Faces detected: %d", face_count,
            extra={"face_count": face_count, "event": "face_detected"},
        )

    def face_aligned(self) -> None:
        logger.info(
            "Face aligned",
            extra={"event": "face_aligned"},
        )

    def embedding_extracted(self, dimension: int) -> None:
        logger.info(
            "Embedding extracted: dim=%d", dimension,
            extra={"dimension": dimension, "event": "embedding_extracted"},
        )

    def similarity_computed(self, score: float, is_match: bool) -> None:
        logger.info(
            "Similarity: score=%.4f, match=%s", score, is_match,
            extra={
                "score": round(score, 4),
                "is_match": is_match,
                "event": "similarity_computed",
            },
        )

    def no_face_detected(self) -> None:
        logger.warning(
            "No face detected in image",
            extra={"event": "no_face_detected"},
        )

    def recognition_failure(self, error: str) -> None:
        logger.error(
            "Face recognition failed: %s", error,
            extra={"error": error, "event": "face_recognition_failure"},
        )

    def recognition_completed(self) -> None:
        logger.info(
            "Face recognition completed",
            extra={"event": "face_recognition_completed"},
        )
