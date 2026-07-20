import logging
from datetime import datetime
from typing import Optional

from app.models.manual_review import ManualReview
from app.repositories.manual_review_repository import ManualReviewRepository
from app.services.admin.event_logger import EventLogger

logger = logging.getLogger(__name__)


class ManualReviewError(Exception):
    pass


class ManualReviewService:
    def __init__(self):
        self._repo = ManualReviewRepository()
        self._events = EventLogger()

    async def create_review(
        self,
        request_id: str,
        vehicle_id: str,
        driver_id: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> ManualReview:
        import uuid
        review = ManualReview(
            review_id=str(uuid.uuid4()),
            request_id=request_id,
            vehicle_id=vehicle_id,
            driver_id=driver_id,
            reviewer_notes=notes,
        )
        result = await self._repo.create(review)
        logger.info(
            "Manual review created | review=%s vehicle=%s",
            result.review_id, vehicle_id,
        )
        return result

    async def approve_review(
        self, review_id: str, reviewer_id: str, notes: Optional[str] = None,
    ) -> ManualReview:
        review = await self._repo.get_by_review_id(review_id)
        if not review:
            raise ManualReviewError(f"Review '{review_id}' not found")
        if review.status != "pending":
            raise ManualReviewError(
                f"Review '{review_id}' is already {review.status}"
            )

        review.status = "approved"
        review.outcome = "GRANT"
        review.reviewer_id = reviewer_id
        review.reviewed_at = datetime.utcnow()
        if notes:
            review.reviewer_notes = notes

        result = await self._repo.update(review)
        await self._events.log_review_action(review_id, "approved", reviewer_id)
        return result

    async def reject_review(
        self, review_id: str, reviewer_id: str, notes: Optional[str] = None,
    ) -> ManualReview:
        review = await self._repo.get_by_review_id(review_id)
        if not review:
            raise ManualReviewError(f"Review '{review_id}' not found")
        if review.status != "pending":
            raise ManualReviewError(
                f"Review '{review_id}' is already {review.status}"
            )

        review.status = "rejected"
        review.outcome = "DENY"
        review.reviewer_id = reviewer_id
        review.reviewed_at = datetime.utcnow()
        if notes:
            review.reviewer_notes = notes

        result = await self._repo.update(review)
        await self._events.log_review_action(review_id, "rejected", reviewer_id)
        return result

    async def get_review(self, review_id: str) -> Optional[ManualReview]:
        return await self._repo.get_by_review_id(review_id)

    async def get_all_reviews(
        self, status: Optional[str] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[ManualReview]:
        return await self._repo.get_all(
            status=status, skip=skip, limit=limit,
        )

    async def count_pending(self) -> int:
        return await self._repo.count_pending()
