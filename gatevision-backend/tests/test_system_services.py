import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.system.configuration_service import ConfigurationService
from app.services.system.version_service import VersionService
from app.services.system.performance_service import PerformanceService
from app.services.system.model_monitor_service import ModelMonitorService
from app.services.system.system_logger import SystemLogger
from app.services.system.cleanup_service import CleanupService
from app.services.system.storage_service import SystemStorageService
from app.utils.security import (
    validate_upload,
    compute_file_hash,
    sanitize_filename,
    check_path_traversal,
    validate_image_dimensions,
)
from fastapi import UploadFile
from fastapi.exceptions import HTTPException
from io import BytesIO


# ── Configuration Service ──────────────────────────────────────────

def test_get_configuration():
    svc = ConfigurationService()
    config = svc.get_configuration()
    assert "similarity_thresholds" in config
    assert "decision_weights" in config
    assert "ocr_thresholds" in config
    assert config["max_upload_size_mb"] > 0
    assert "plate_detection" in config


def test_validate_configuration_passes():
    svc = ConfigurationService()
    warnings = svc.validate_configuration()
    assert isinstance(warnings, list)


# ── Version Service ─────────────────────────────────────────────────

def test_version_service():
    svc = VersionService()
    info = svc.get_version_info()
    assert info["system_name"] == "GateVision API"
    assert info["version"] == "1.0.0"
    assert "python_version" in info
    assert "fastapi_version" in info
    assert "ai_libraries" in info


# ── Performance Service ─────────────────────────────────────────────

@patch("app.services.system.performance_service.get_pipeline_metrics")
def test_performance_service(mock_get_metrics):
    mock_metrics = MagicMock()
    mock_metrics.snapshot.return_value = MagicMock(
        total_pipelines=10,
        success_count=8,
        failure_count=2,
        avg_total_duration_ms=45.5,
        stages=[
            MagicMock(
                stage_name="test_stage",
                total_calls=10,
                success_count=8,
                failure_count=2,
                avg_duration_ms=12.3,
            )
        ],
    )
    mock_metrics.get_recent_requests.return_value = [
        {"request_id": "r1", "success": True, "total_duration_ms": 50.0, "stage_count": 3, "timestamp": 1000}
    ]
    mock_get_metrics.return_value = mock_metrics

    svc = PerformanceService()
    result = svc.get_performance_metrics()
    assert result["total_processed_requests"] == 10
    assert result["success_count"] == 8
    assert result["failed_requests"] == 2
    assert result["pipeline_success_rate"] == 80.0
    assert "avg_stage_times_ms" in result


# ── Model Monitor Service ──────────────────────────────────────────

@patch("app.services.system.model_monitor_service.ModelRegistry")
def test_model_monitor_no_models(mock_registry_cls):
    mock_reg = MagicMock()
    mock_reg.get_all_infos.return_value = []
    mock_registry_cls.return_value = mock_reg

    svc = ModelMonitorService()
    svc._registry = mock_reg
    result = svc.get_all_model_infos()
    assert result == []


# ── System Logger ───────────────────────────────────────────────────

def test_system_logger():
    log = SystemLogger()
    log.startup()
    log.shutdown()
    log.critical_error("test", "msg")
    log.config_validation([])
    log.config_validation(["warn1"])
    log.backup_started("db", "test.json")
    log.backup_completed("db", "test.json", 10)
    log.backup_failed("db", "error")
    log.cleanup_started()
    log.cleanup_completed(5, 1000)
    log.model_loaded("yolo", "cpu", "1.0")
    log.model_failed("yolo", "error")


# ── Cleanup Service ─────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("app.services.system.cleanup_service.Image")
@patch("app.services.system.cleanup_service.SystemEvent")
async def test_cleanup_service(mock_se, mock_img):
    mock_img.find_all.return_value.__aiter__.return_value = iter([])
    mock_se.return_value.insert = AsyncMock()

    with tempfile.TemporaryDirectory() as tmp:
        svc = CleanupService()
        svc._upload_dir = Path(tmp)
        (Path(tmp) / "temp").mkdir()
        (Path(tmp) / "temp" / "tmp_file.jpg").write_bytes(b"data")
        (Path(tmp) / "faces").mkdir()
        (Path(tmp) / "faces" / "face1.jpg").write_bytes(b"face_data")

        result = await svc.cleanup()
        assert result["deleted_files"] > 0
        assert result["deleted_temp_files"] > 0


# ── Storage Service ─────────────────────────────────────────────────

@pytest.mark.asyncio
@patch("app.services.system.storage_service.Image")
async def test_storage_service(mock_img):
    mock_img.find.return_value.count = AsyncMock(return_value=5)
    mock_img.find_all.return_value.__aiter__.return_value = iter([])

    svc = SystemStorageService()
    with tempfile.TemporaryDirectory() as tmp:
        svc._upload_dir = Path(tmp)
        (Path(tmp) / "faces").mkdir()
        (Path(tmp) / "faces" / "f1.jpg").write_bytes(b"d" * 100)
        info = await svc.get_storage_info()
        assert info["total_images"] >= 0
        assert "images_by_category" in info


# ── Security Validations ────────────────────────────────────────────

def test_compute_file_hash():
    h = compute_file_hash(b"test data")
    assert len(h) == 64
    assert isinstance(h, str)


def test_sanitize_filename():
    assert sanitize_filename("safe.jpg") == "safe.jpg"
    assert "../" not in sanitize_filename("../bad.jpg")
    assert "\\" not in sanitize_filename("..\\bad.jpg")


def test_check_path_traversal():
    check_path_traversal("normal/path/file.jpg")
    with pytest.raises(HTTPException):
        check_path_traversal("../etc/passwd")
    with pytest.raises(HTTPException):
        check_path_traversal("..\\windows\\system32")


def test_validate_image_dimensions():
    validate_image_dimensions(640, 480)
    with pytest.raises(HTTPException):
        validate_image_dimensions(0, 100)
    with pytest.raises(HTTPException):
        validate_image_dimensions(100, 0)
    with pytest.raises(HTTPException):
        validate_image_dimensions(10001, 100)


def _make_upload_file(filename: str, content_type: str, data: bytes):
    f = MagicMock(spec=UploadFile)
    f.filename = filename
    f.content_type = content_type
    f.read = AsyncMock(return_value=data)
    return f


@pytest.mark.asyncio
async def test_validate_upload_empty():
    f = _make_upload_file("test.jpg", "image/jpeg", b"")
    with pytest.raises(HTTPException) as exc:
        await validate_upload(f)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_validate_upload_bad_type():
    f = _make_upload_file("test.txt", "text/plain", b"data")
    with pytest.raises(HTTPException) as exc:
        await validate_upload(f)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_validate_upload_traversal():
    f = _make_upload_file("../bad.jpg", "image/jpeg", b"data")
    with pytest.raises(HTTPException) as exc:
        await validate_upload(f)
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_validate_upload_success():
    data = b"fake_image_data"
    f = _make_upload_file("test.jpg", "image/jpeg", data)
    result = await validate_upload(f)
    assert result == data
