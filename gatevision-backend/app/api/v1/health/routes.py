from datetime import datetime, timezone
from fastapi import APIRouter, status

from app.config.settings import settings
from app.database.connection import get_database
from app.schemas.response import APIResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=APIResponse,
    status_code=status.HTTP_200_OK,
)
async def health_check():
    db = get_database()
    db_status = "connected" if db is not None else "disconnected"

    return APIResponse(
        success=True,
        message="Service is healthy",
        data={
            "application": settings.APP_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
            "database": db_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )
