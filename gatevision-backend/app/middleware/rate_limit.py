import time
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from fastapi import status

from app.config.settings import settings

SENSITIVE_PATHS = {
    "/api/v1/auth/register": {"max_requests": 10, "window": 300},
    "/api/v1/auth/login": {"max_requests": 20, "window": 60},
    "/api/v1/system/backup/export": {"max_requests": 5, "window": 300},
    "/api/v1/system/backup/import": {"max_requests": 5, "window": 300},
    "/api/v1/system/storage/cleanup": {"max_requests": 10, "window": 300},
}


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        # Skip preflight OPTIONS requests (browser-generated, not user actions)
        if request.method == "OPTIONS":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        now = time.time()

        limits = SENSITIVE_PATHS.get(path)

        if limits:
            max_r = limits["max_requests"]
            window = limits["window"]
            key = f"{client_ip}:{path}"
        else:
            max_r = settings.RATE_LIMIT_REQUESTS
            window = settings.RATE_LIMIT_WINDOW_SECONDS
            key = client_ip

        self.requests[key] = [
            t for t in self.requests[key] if now - t < window
        ]

        if len(self.requests[key]) >= max_r:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "message": "Rate limit exceeded. Try again later.",
                    "errors": [],
                },
            )

        self.requests[key].append(now)
        return await call_next(request)
