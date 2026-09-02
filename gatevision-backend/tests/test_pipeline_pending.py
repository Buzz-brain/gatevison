from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.pipeline.routes import router
from app.services.ai.orchestrator.orchestrator import PipelineOrchestrator
from app.services.ai.orchestrator.pipeline_result import PipelineResult
from app.services.ai.orchestrator.pending_vehicle_service import PendingVehicleService

SAMPLE_FRAME = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


def _make_result(plates=None) -> PipelineResult:
    return PipelineResult(
        success=True,
        request_id="req123",
        total_processing_time=5.0,
        detected_plates=[{"bbox": [1, 2, 3, 4]}],
        recognized_plates=plates or [{
            "plate": "ABC123AA",
            "confidence": 0.92,
            "validation_status": "valid",
        }],
    )


def _make_record(plate="ABC123AA", direction="entry"):
    """Lightweight stand-in for PendingVehicle (never touches Beanie)."""

    def _build():
        id_ = "rec-123"
        return SimpleNamespace(
            id=id_,
            source="camera",
            frame=b"\xff\xd8\xff\xe0fakejpeg",
            plate_text=plate,
            direction=direction,
            vehicles_detected=1,
            processing_time_ms=5.0,
            created_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=120),
        )

    return _build()


@pytest.mark.asyncio
async def test_create_from_result_stores_frame_and_plate():
    svc = PendingVehicleService()
    repo = MagicMock()
    repo.create = AsyncMock(side_effect=lambda record: record)
    svc.repository = repo

    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.to_bytes",
        return_value=b"\xff\xd8\xff\xe0encoded",
    ) as mock_enc:
        record = await svc.create_from_result(
            _make_result(), direction="exit", frame=SAMPLE_FRAME, source="camera"
        )

    assert record.direction == "exit"
    assert record.plate_text == "ABC123AA"
    assert record.frame == b"\xff\xd8\xff\xe0encoded"
    assert record.expires_at is not None
    mock_enc.assert_called_once()
    repo.create.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_from_result_prefers_validated_plate():
    svc = PendingVehicleService()
    repo = MagicMock()
    repo.create = AsyncMock(side_effect=lambda record: record)
    svc.repository = repo

    result = _make_result([
        {"plate": "SCHOOL NAME", "confidence": 0.99, "validation_status": "unchecked"},
        {"plate": "ABC123AA", "confidence": 0.80, "validation_status": "valid"},
    ])
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.to_bytes",
        return_value=b"data",
    ):
        record = await svc.create_from_result(result, frame=SAMPLE_FRAME)

    assert record.plate_text == "ABC123AA"


@pytest.mark.asyncio
async def test_get_latest_filters_expired_and_prunes():
    svc = PendingVehicleService()
    svc.repository = MagicMock()
    svc.repository.delete_expired = AsyncMock()
    svc.repository.find_latest = AsyncMock(return_value=_make_record())

    record = await svc.get_latest(direction="entry")

    assert record is not None
    assert svc.repository.delete_expired.await_count == 1
    svc.repository.find_latest.assert_awaited_with(direction="entry")


@pytest.mark.asyncio
async def test_get_latest_returns_none_when_nothing_pending():
    svc = PendingVehicleService()
    svc.repository = MagicMock()
    svc.repository.delete_expired = AsyncMock()
    svc.repository.find_latest = AsyncMock(return_value=None)

    assert await svc.get_latest(direction="entry") is None


@pytest.mark.asyncio
async def test_get_latest_survives_prune_failure():
    svc = PendingVehicleService()
    svc.repository = MagicMock()
    svc.repository.delete_expired = AsyncMock(side_effect=RuntimeError("mongo down"))
    svc.repository.find_latest = AsyncMock(return_value=None)

    assert await svc.get_latest(direction="entry") is None


@pytest.mark.asyncio
async def test_consume_deletes_record():
    svc = PendingVehicleService()
    svc.repository = MagicMock()
    svc.repository.delete = AsyncMock(return_value=True)

    assert await svc.consume("abc") is True
    svc.repository.delete.assert_awaited_with("abc")


@pytest.mark.asyncio
async def test_to_dict_omits_frame_bytes():
    info = PendingVehicleService.to_dict(_make_record())
    assert info["plate_text"] == "ABC123AA"
    assert info["direction"] == "entry"
    assert info["id"] == "rec-123"
    assert "frame" not in info


@pytest.mark.asyncio
async def test_to_dict_none():
    assert PendingVehicleService.to_dict(None) is None


@pytest.fixture
def app():
    application = FastAPI()
    application.include_router(router)
    return application


def _override_deps(app, orch=None, svc=None):
    from app.api.v1.pipeline.routes import (
        get_orchestrator as _get_orch,
        get_pending_vehicle_service as _get_svc,
    )
    if orch is not None:
        app.dependency_overrides[_get_orch] = lambda: orch
    if svc is not None:
        app.dependency_overrides[_get_svc] = lambda: svc


@pytest.mark.asyncio
async def test_get_pending_no_record(app):
    svc = PendingVehicleService()
    svc.repository = MagicMock()
    svc.repository.delete_expired = AsyncMock()
    svc.repository.find_latest = AsyncMock(return_value=None)
    _override_deps(app, svc=svc)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/pipeline/pending?direction=entry")
    assert resp.status_code == 200
    assert resp.json()["data"] is None


@pytest.mark.asyncio
async def test_get_pending_with_record(app):
    svc = PendingVehicleService()
    svc.repository = MagicMock()
    svc.repository.delete_expired = AsyncMock()
    svc.repository.find_latest = AsyncMock(return_value=_make_record())
    _override_deps(app, svc=svc)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/pipeline/pending?direction=entry")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["plate_text"] == "ABC123AA"
    assert data["direction"] == "entry"


@pytest.mark.asyncio
async def test_complete_pending_not_found(app):
    svc = PendingVehicleService()
    svc.repository = MagicMock()
    svc.repository.get = AsyncMock(return_value=None)
    _override_deps(app, svc=svc)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/pipeline/pending/complete?pending_id=missing",
            files={"face_file": ("face.jpg", b"\xff\xd8fake", "image/jpeg")},
        )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_complete_pending_runs_combined_pipeline_and_consumes(app):
    svc = PendingVehicleService()
    svc.repository = MagicMock()
    svc.repository.get = AsyncMock(return_value=_make_record())
    svc.repository.delete = AsyncMock(return_value=True)

    orch = PipelineOrchestrator(services=MagicMock())
    orch.execute_from_pending = AsyncMock(return_value=_make_result())

    _override_deps(app, orch=orch, svc=svc)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/pipeline/pending/complete?pending_id=abc",
            files={"face_file": ("face.jpg", b"\xff\xd8fake", "image/jpeg")},
        )

    assert resp.status_code == 200
    orch.execute_from_pending.assert_awaited_once()
    call = orch.execute_from_pending.call_args
    assert call.kwargs["frame_data"] == b"\xff\xd8\xff\xe0fakejpeg"
    assert call.kwargs["direction"] == "entry"
    assert call.kwargs["require_face"] is True
    assert call.kwargs["finalize"] is True
    assert call.kwargs["face_data"] is not None
    svc.repository.delete.assert_awaited_once_with("abc")


@pytest.mark.asyncio
async def test_create_pending_endpoint(app):
    svc = PendingVehicleService()
    svc.repository = MagicMock()
    svc.repository.create = AsyncMock(side_effect=lambda record: record)

    orch = PipelineOrchestrator(services=MagicMock())
    orch.capture_vehicle_preview = AsyncMock(return_value=(SAMPLE_FRAME, _make_result()))

    _override_deps(app, orch=orch, svc=svc)
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.to_bytes",
        return_value=b"encoded",
    ):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/pipeline/pending?direction=entry")

    assert resp.status_code == 200
    orch.capture_vehicle_preview.assert_awaited_once()
    svc.repository.create.assert_awaited_once()
    data = resp.json()["data"]
    assert data["pending_vehicle"]["plate_text"] == "ABC123AA"


@pytest.mark.asyncio
async def test_capture_vehicle_preview_runs_only_vehicle_stages():
    from app.services.ai.orchestrator.orchestrator import PipelineServices

    detection = MagicMock()
    detection.camera_service.capture.return_value = SAMPLE_FRAME
    detection.detect_from_frame = AsyncMock(return_value={
        "detections": [{"bbox": [10, 15, 50, 15, 50, 35, 10, 35], "confidence": 0.95}],
    })
    vehicle = MagicMock()
    vehicle.is_available.return_value = True
    vehicle.extract_fingerprint = AsyncMock(return_value={
        "embedding": [0.1, 0.2, 0.3], "dimension": 3, "duration_ms": 2.0, "plate_text": None,
    })
    services = PipelineServices(
        detection_service=detection,
        ocr_service=MagicMock(),
    )
    services.vehicle_fingerprint_service = vehicle

    orch = PipelineOrchestrator(services=services)
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.to_bytes",
        return_value=b"jpg",
    ) as mock_enc:
        frame, result = await orch.capture_vehicle_preview("cam1", direction="entry")

    assert frame is not None
    assert len(result.detected_plates) == 1
    assert len(result.vehicle_fingerprints) == 1
    detection.camera_service.capture.assert_called_once()
    mock_enc.assert_not_called()


@pytest.mark.asyncio
async def test_execute_from_pending_uses_stored_frame_and_face():
    from app.services.ai.orchestrator.orchestrator import PipelineServices

    detection = MagicMock()
    detection.detect_from_frame = AsyncMock(return_value={
        "detections": [{"bbox": [30, 40, 80, 55], "confidence": 0.95}],
    })
    ocr = MagicMock()
    ocr.read_many = AsyncMock(return_value=[{
        "plate_index": 0, "raw_text": "APP220", "cleaned_text": "APP220",
        "confidence": 0.9, "validation_status": "valid",
    }])
    face = MagicMock()
    face.is_available.return_value = True
    face.recognize_from_image = AsyncMock(return_value={
        "face_detected": True, "face_count": 1, "detections": [{"embedding": [0.5, 0.5]}],
    })
    services = PipelineServices(
        detection_service=detection,
        ocr_service=ocr,
    )
    services.face_recognition_service = face

    orch = PipelineOrchestrator(services=services)
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=SAMPLE_FRAME,
    ):
        result = await orch.execute_from_pending(
            frame_data=b"frame",
            direction="entry",
            require_face=True,
            face_data=b"face",
            finalize=True,
        )

    assert result.success is True
    assert result.recognized_plates[0]["plate"] == "APP220"
    face.recognize_from_image.assert_awaited_once()


@pytest.mark.asyncio
async def test_execute_from_pending_invalid_frame_raises():
    from app.services.ai.orchestrator.orchestrator import PipelineServices
    from app.services.ai.orchestrator.exceptions import ContextValidationError

    services = PipelineServices(
        detection_service=MagicMock(),
        ocr_service=MagicMock(),
    )
    orch = PipelineOrchestrator(services=services)
    with patch(
        "app.services.ai.camera.frame_processor.FrameProcessor.read_bytes",
        return_value=None,
    ):
        with pytest.raises(ContextValidationError):
            await orch.execute_from_pending(
                frame_data=b"bad", direction="entry", face_data=None
            )