import logging
import time
import uuid
from datetime import datetime, timezone

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every HTTP request with a request ID, start/end times, duration and status.

    Pipeline stage timings and the final decision are correlated with the same
    request ID (the pipeline routes forward request.state.request_id into the
    orchestrator), so a single request_id links the full lifecycle.
    """

    async def dispatch(self, request: Request, call_next):
        request_id = (
            request.headers.get("X-Request-ID")
            or uuid.uuid4().hex[:12]
        )
        request.state.request_id = request_id

        method = request.method
        path = request.url.path
        client = request.client.host if request.client else "unknown"
        start = time.perf_counter()
        start_iso = datetime.now(timezone.utc).isoformat()

        logger.info(
            "Request started: %s %s (client=%s)",
            method, path, client,
            extra={
                "request_id": request_id,
                "event": "request_start",
                "method": method,
                "path": path,
                "start_time": start_iso,
            },
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.error(
                "Request failed: %s %s (%.2fms): %s",
                method, path, elapsed_ms, exc,
                extra={
                    "request_id": request_id,
                    "event": "request_failed",
                    "method": method,
                    "path": path,
                    "status_code": 500,
                    "duration_ms": round(elapsed_ms, 2),
                    "error": str(exc),
                },
            )
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        status_code = response.status_code
        logger.info(
            "Request completed: %s %s -> %d (%.2fms)",
            method, path, status_code, elapsed_ms,
            extra={
                "request_id": request_id,
                "event": "request_completed",
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": round(elapsed_ms, 2),
                "start_time": start_iso,
                "end_time": datetime.now(timezone.utc).isoformat(),
            },
        )
        response.headers["X-Request-ID"] = request_id
        return response
