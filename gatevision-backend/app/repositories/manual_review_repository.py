from typing import Optional

from app.models.manual_review import ManualReview


class ManualReviewRepository:
    @staticmethod
    async def create(review: ManualReview) -> ManualReview:
        return await review.insert()

    @staticmethod
    async def get_by_review_id(review_id: str) -> Optional[ManualReview]:
        return await ManualReview.find_one(
            ManualReview.review_id == review_id
        )

    @staticmethod
    async def get_by_request_id(request_id: str) -> Optional[ManualReview]:
        return await ManualReview.find_one(
            ManualReview.request_id == request_id
        )

    @staticmethod
    async def update(review: ManualReview) -> ManualReview:
        return await review.save()

    @staticmethod
    async def get_all(
        status: Optional[str] = None,
        skip: int = 0, limit: int = 100,
    ) -> list[ManualReview]:
        query = {}
        if status:
            query["status"] = status
        return (
            await ManualReview.find(query)
            .sort(-ManualReview.created_at)
            .skip(skip)
            .limit(limit)
            .to_list()
        )

    @staticmethod
    async def count(status: Optional[str] = None) -> int:
        if status:
            return await ManualReview.find(
                ManualReview.status == status
            ).count()
        return await ManualReview.find_all().count()

    @staticmethod
    async def count_pending() -> int:
        return await ManualReview.find(
            ManualReview.status == "pending"
        ).count()
