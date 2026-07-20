from unittest.mock import AsyncMock, MagicMock, patch

import numpy as np
import pytest

from app.services.admin.enrollment_service import EnrollmentError, EnrollmentService


@pytest.fixture
def sample_image():
    return np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)


@pytest.mark.asyncio
async def test_enroll_driver_success(sample_image):
    svc = EnrollmentService(
        face_recognition_service=MagicMock(),
        vehicle_fingerprint_service=None,
    )
    svc._face_svc.recognize_from_image = AsyncMock(
        return_value={
            "face_detected": True,
            "face_count": 1,
            "embeddings": [[0.1, 0.2, 0.3, 0.4]],
        }
    )
    svc._registration.register_driver = AsyncMock(
        return_value=MagicMock(driver_id="DRV-001")
    )
    svc._registration.store_face_embedding = AsyncMock(
        return_value=MagicMock(driver_id="DRV-001")
    )
    svc._events.log_event = AsyncMock()

    result = await svc.enroll_driver_with_image(
        driver_id="DRV-001",
        image=sample_image,
        full_name="John Doe",
    )
    assert result["driver_id"] == "DRV-001"
    assert result["face_embedding_dimension"] == 4


@pytest.mark.asyncio
async def test_enroll_driver_no_face_service(sample_image):
    svc = EnrollmentService(face_recognition_service=None)
    with pytest.raises(EnrollmentError, match="not available"):
        await svc.enroll_driver_with_image(
            driver_id="DRV-001", image=sample_image, full_name="John",
        )


@pytest.mark.asyncio
async def test_enroll_driver_no_face_detected(sample_image):
    svc = EnrollmentService(face_recognition_service=MagicMock())
    svc._face_svc.recognize_from_image = AsyncMock(
        return_value={"face_detected": False, "face_count": 0}
    )
    svc._registration.register_driver = AsyncMock(
        return_value=MagicMock(driver_id="DRV-001")
    )
    with pytest.raises(EnrollmentError, match="No face detected"):
        await svc.enroll_driver_with_image(
            driver_id="DRV-001", image=sample_image, full_name="John",
        )


@pytest.mark.asyncio
async def test_enroll_vehicle_success(sample_image):
    svc = EnrollmentService(
        face_recognition_service=None,
        vehicle_fingerprint_service=MagicMock(),
    )
    svc._vehicle_svc.extract_fingerprint = AsyncMock(
        return_value={
            "embedding": [0.5, 0.6, 0.7, 0.8],
            "dimension": 4,
        }
    )
    svc._registration.register_vehicle = AsyncMock(
        return_value=MagicMock(vehicle_id="VEH-001")
    )
    svc._registration.store_vehicle_embedding = AsyncMock(
        return_value=MagicMock(vehicle_id="VEH-001")
    )
    svc._events.log_event = AsyncMock()

    result = await svc.enroll_vehicle_with_image(
        vehicle_id="VEH-001",
        plate_number="ABC-1234",
        image=sample_image,
    )
    assert result["vehicle_id"] == "VEH-001"
    assert result["plate_number"] == "ABC-1234"
    assert result["embedding_dimension"] == 4


@pytest.mark.asyncio
async def test_enroll_vehicle_no_fingerprint_service(sample_image):
    svc = EnrollmentService(vehicle_fingerprint_service=None)
    with pytest.raises(EnrollmentError, match="not available"):
        await svc.enroll_vehicle_with_image(
            vehicle_id="VEH-001", plate_number="ABC-1234", image=sample_image,
        )


@pytest.mark.asyncio
async def test_link_and_enroll():
    svc = EnrollmentService()
    svc._registration.link_drivers = AsyncMock(
        return_value=MagicMock(linked_driver_ids=["DRV-001", "DRV-002"])
    )
    svc._events.log_event = AsyncMock()

    result = await svc.link_and_enroll(
        vehicle_id="VEH-001", driver_ids=["DRV-001", "DRV-002"],
    )
    assert len(result["linked_driver_ids"]) == 2
