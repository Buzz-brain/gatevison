from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.services.ai.vehicle_fingerprint.fingerprint_service import (
    VehicleFingerprintService,
)


@pytest.fixture
def sample_image():
    return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


@pytest.fixture
def mock_deps():
    with patch.multiple(
        "app.services.ai.vehicle_fingerprint.fingerprint_service",
        VehicleLoader=MagicMock(),
        VehicleDetector=MagicMock(),
        VehicleFeatureExtractor=MagicMock(),
        VehicleRepository=MagicMock(),
    ):
        yield


def test_load(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleLoader"
    ) as mock_loader_cls:
        mock_loader = MagicMock()
        mock_loader_cls.return_value = mock_loader

        svc = VehicleFingerprintService()
        svc.load()
        mock_loader.load.assert_called_once()


def test_is_loaded(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleLoader"
    ) as mock_loader_cls:
        mock_loader = MagicMock()
        mock_loader.is_loaded.return_value = True
        mock_loader_cls.return_value = mock_loader

        svc = VehicleFingerprintService()
        assert svc.is_loaded() is True


@pytest.mark.asyncio
async def test_extract_fingerprint(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleDetector"
    ) as mock_det_cls, patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleFeatureExtractor"
    ) as mock_ext_cls:

        mock_det = MagicMock()
        mock_det.detect.return_value = [
            {"bbox": [0, 0, 100, 100], "confidence": 1.0, "vehicle_crop_path": ""}
        ]
        mock_det_cls.return_value = mock_det

        mock_ext = MagicMock()
        mock_ext.extract.return_value = {
            "embedding": [0.1] * 2048,
            "dimension": 2048,
            "duration_ms": 50.0,
        }
        mock_ext_cls.return_value = mock_ext

        svc = VehicleFingerprintService()
        result = await svc.extract_fingerprint(
            sample_image, plate_text="ABC-1234"
        )
        assert result["dimension"] == 2048
        assert result["plate_text"] == "ABC-1234"


@pytest.mark.asyncio
async def test_extract_fingerprint_no_vehicle(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleDetector"
    ) as mock_det_cls:
        mock_det = MagicMock()
        mock_det.detect.return_value = []
        mock_det_cls.return_value = mock_det

        from app.services.ai.vehicle_fingerprint.fingerprint_service import (
            VehicleFingerprintError,
        )

        svc = VehicleFingerprintService()
        with pytest.raises(VehicleFingerprintError):
            await svc.extract_fingerprint(sample_image)


@pytest.mark.asyncio
async def test_store_fingerprint(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleRepository"
    ) as mock_repo_cls:
        mock_repo = MagicMock()
        mock_repo.find_by_plate = AsyncMock(return_value=None)
        mock_record = MagicMock()
        mock_record.id = "rec1"
        mock_record.plate_text = "ABC-1234"
        mock_record.dimension = 2048
        mock_repo.create = AsyncMock(return_value=mock_record)
        mock_repo_cls.return_value = mock_repo

        svc = VehicleFingerprintService()
        record = await svc.store_fingerprint("ABC-1234", [0.1] * 2048)
        assert str(record.id) == "rec1"


@pytest.mark.asyncio
async def test_store_fingerprint_update_existing(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleRepository"
    ) as mock_repo_cls:
        existing = MagicMock()
        existing.id = "rec1"
        existing.plate_text = "ABC-1234"
        existing.embedding = [0.1] * 2048

        mock_repo = MagicMock()
        mock_repo.find_by_plate = AsyncMock(return_value=existing)
        mock_repo.update = AsyncMock(return_value=existing)
        mock_repo_cls.return_value = mock_repo

        svc = VehicleFingerprintService()
        record = await svc.store_fingerprint("ABC-1234", [0.2] * 2048)
        assert record is existing


@pytest.mark.asyncio
async def test_verify_match(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleDetector"
    ) as mock_det_cls, patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleFeatureExtractor"
    ) as mock_ext_cls, patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleRepository"
    ) as mock_repo_cls:

        mock_det = MagicMock()
        mock_det.detect.return_value = [
            {"bbox": [0, 0, 100, 100], "confidence": 1.0, "vehicle_crop_path": ""}
        ]
        mock_det_cls.return_value = mock_det

        mock_ext = MagicMock()
        mock_ext.extract.return_value = {
            "embedding": [0.5, 0.3, 0.7],
            "dimension": 3,
            "duration_ms": 10.0,
        }
        mock_ext_cls.return_value = mock_ext

        stored = MagicMock()
        stored.plate_text = "ABC-1234"
        stored.embedding = [0.5, 0.3, 0.7]

        mock_repo = MagicMock()
        mock_repo.find_by_plate = AsyncMock(return_value=stored)
        mock_repo_cls.return_value = mock_repo

        svc = VehicleFingerprintService()
        result = await svc.verify(sample_image, "ABC-1234")
        assert result["match"] is True
        assert pytest.approx(result["score"], 0.01) == 1.0


@pytest.mark.asyncio
async def test_verify_no_match(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleDetector"
    ) as mock_det_cls, patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleFeatureExtractor"
    ) as mock_ext_cls, patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleRepository"
    ) as mock_repo_cls:

        mock_det = MagicMock()
        mock_det.detect.return_value = [
            {"bbox": [0, 0, 100, 100], "confidence": 1.0, "vehicle_crop_path": ""}
        ]
        mock_det_cls.return_value = mock_det

        mock_ext = MagicMock()
        mock_ext.extract.return_value = {
            "embedding": [1.0, 0.0],
            "dimension": 2,
            "duration_ms": 10.0,
        }
        mock_ext_cls.return_value = mock_ext

        stored = MagicMock()
        stored.plate_text = "ABC-1234"
        stored.embedding = [0.0, 1.0]

        mock_repo = MagicMock()
        mock_repo.find_by_plate = AsyncMock(return_value=stored)
        mock_repo_cls.return_value = mock_repo

        svc = VehicleFingerprintService()
        result = await svc.verify(sample_image, "ABC-1234")
        assert result["match"] is False


@pytest.mark.asyncio
async def test_verify_no_stored(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleRepository"
    ) as mock_repo_cls:
        mock_repo = MagicMock()
        mock_repo.find_by_plate = AsyncMock(return_value=None)
        mock_repo_cls.return_value = mock_repo

        svc = VehicleFingerprintService()
        result = await svc.verify(sample_image, "NONEXIST")
        assert result["match"] is False
        assert result["score"] == 0.0


@pytest.mark.asyncio
async def test_lookup(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleDetector"
    ) as mock_det_cls, patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleFeatureExtractor"
    ) as mock_ext_cls, patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleRepository"
    ) as mock_repo_cls:

        mock_det = MagicMock()
        mock_det.detect.return_value = [
            {"bbox": [0, 0, 100, 100], "confidence": 1.0, "vehicle_crop_path": ""}
        ]
        mock_det_cls.return_value = mock_det

        mock_ext = MagicMock()
        mock_ext.extract.return_value = {
            "embedding": [1.0, 0.0],
            "dimension": 2,
            "duration_ms": 10.0,
        }
        mock_ext_cls.return_value = mock_ext

        stored = MagicMock()
        stored.id = "rec1"
        stored.plate_text = "ABC-1234"
        stored.embedding = [1.0, 0.0]

        mock_repo = MagicMock()
        mock_repo.get_all = AsyncMock(return_value=[stored])
        mock_repo_cls.return_value = mock_repo

        svc = VehicleFingerprintService()
        matches = await svc.lookup(sample_image, top_k=5)
        assert len(matches) == 1
        assert matches[0]["plate_text"] == "ABC-1234"


@pytest.mark.asyncio
async def test_lookup_empty_db(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleDetector"
    ) as mock_det_cls, patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleFeatureExtractor"
    ) as mock_ext_cls, patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleRepository"
    ) as mock_repo_cls:

        mock_det = MagicMock()
        mock_det.detect.return_value = [
            {"bbox": [0, 0, 100, 100], "confidence": 1.0, "vehicle_crop_path": ""}
        ]
        mock_det_cls.return_value = mock_det

        mock_ext = MagicMock()
        mock_ext.extract.return_value = {
            "embedding": [1.0, 0.0],
            "dimension": 2,
            "duration_ms": 10.0,
        }
        mock_ext_cls.return_value = mock_ext

        mock_repo = MagicMock()
        mock_repo.get_all = AsyncMock(return_value=[])
        mock_repo_cls.return_value = mock_repo

        svc = VehicleFingerprintService()
        matches = await svc.lookup(sample_image, top_k=5)
        assert matches == []


@pytest.mark.asyncio
async def test_delete_fingerprint(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleRepository"
    ) as mock_repo_cls:
        mock_repo = MagicMock()
        mock_repo.delete_by_plate = AsyncMock(return_value=True)
        mock_repo_cls.return_value = mock_repo

        svc = VehicleFingerprintService()
        result = await svc.delete_fingerprint("ABC-1234")
        assert result is True


def test_get_model_info(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleLoader"
    ) as mock_loader_cls:
        mock_loader = MagicMock()
        mock_loader.get_metadata.return_value = {
            "loaded": True,
            "model_name": "resnet50",
            "device": "cpu",
            "embedding_dim": 2048,
        }
        mock_loader_cls.return_value = mock_loader

        svc = VehicleFingerprintService()
        info = svc.get_model_info()
        assert info["loaded"] is True
        assert info["model_name"] == "resnet50"


def test_health(sample_image):
    with patch(
        "app.services.ai.vehicle_fingerprint.fingerprint_service.VehicleLoader"
    ) as mock_loader_cls:
        mock_loader = MagicMock()
        mock_loader.get_metadata.return_value = {
            "loaded": True,
            "model_name": "resnet50",
            "device": "cpu",
        }
        mock_loader_cls.return_value = mock_loader

        svc = VehicleFingerprintService()
        h = svc.health()
        assert h["status"] == "healthy"
        assert h["model_loaded"] is True
