"""Request logging middleware: every request gets an ID, timings and status."""
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.middleware.request_logging import RequestLoggingMiddleware


@pytest.fixture
def app():
    application = FastAPI()

    @application.get("/ping")
    async def ping():
        return {"success": True}

    @application.get("/boom")
    async def boom():
        raise RuntimeError("kaboom")

    application.add_middleware(RequestLoggingMiddleware)
    return application


@pytest.mark.asyncio
async def test_request_id_header_set(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/ping")
    assert resp.status_code == 200
    assert "x-request-id" in resp.headers
    assert len(resp.headers["x-request-id"]) == 12


@pytest.mark.asyncio
async def test_request_id_preserved_from_header(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/ping", headers={"X-Request-ID": "custom1234"})
    assert resp.headers["x-request-id"] == "custom1234"


@pytest.mark.asyncio
async def test_request_completed_logged(app):
    transport = ASGITransport(app=app)
    with patch(
        "app.middleware.request_logging.logger.info",
    ) as mock_info:
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.get("/ping")
        assert resp.status_code == 200
        events = [call.kwargs.get("extra", {}).get("event") for call in mock_info.call_args_list]
        assert "request_start" in events
        assert "request_completed" in events


@pytest.mark.asyncio
async def test_request_failed_logged(app):
    transport = ASGITransport(app=app)
    with patch(
        "app.middleware.request_logging.logger.error",
    ) as mock_error:
        # No global exception handler is registered in this test app, so the
        # exception propagates to the client (raise_server_exceptions).
        with pytest.raises(RuntimeError):
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                await ac.get("/boom")
        events = [call.kwargs.get("extra", {}).get("event") for call in mock_error.call_args_list]
        assert "request_failed" in events