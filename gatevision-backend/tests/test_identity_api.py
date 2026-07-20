from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport

from app.api.v1.identity.routes import (
    POLICY_REPO,
    REG_SVC,
    VERIFY_SVC,
    router,
)


@pytest.fixture(autouse=True)
def mock_services():
    REG_SVC.register_driver = AsyncMock(
        return_value=MagicMock(
            driver_id="DRV-001",
            full_name="John Doe",
            email="john@test.com",
            phone="1234567890",
            department="Engineering",
            status="active",
            model_dump=MagicMock(
                return_value={
                    "driver_id": "DRV-001",
                    "full_name": "John Doe",
                    "email": "john@test.com",
                    "phone": "1234567890",
                    "department": "Engineering",
                    "status": "active",
                }
            ),
        )
    )
    REG_SVC.register_vehicle = AsyncMock(
        return_value=MagicMock(
            vehicle_id="VEH-001",
            plate_number="ABC-1234",
            registration_status="active",
            model_dump=MagicMock(
                return_value={
                    "vehicle_id": "VEH-001",
                    "plate_number": "ABC-1234",
                    "registration_status": "active",
                    "linked_driver_ids": [],
                }
            ),
        )
    )
    REG_SVC.store_face_embedding = AsyncMock(
        return_value=MagicMock(
            driver_id="DRV-001",
            model_dump=MagicMock(
                return_value={
                    "driver_id": "DRV-001",
                    "face_embedding_reference": [0.1, 0.2, 0.3],
                }
            ),
        )
    )
    REG_SVC.store_vehicle_embedding = AsyncMock(
        return_value=MagicMock(
            vehicle_id="VEH-001",
            model_dump=MagicMock(
                return_value={
                    "vehicle_id": "VEH-001",
                    "vehicle_embedding_reference": [0.1, 0.2, 0.3],
                }
            ),
        )
    )
    REG_SVC.link_drivers = AsyncMock(
        return_value=MagicMock(
            vehicle_id="VEH-001",
            linked_driver_ids=["DRV-001"],
            model_dump=MagicMock(
                return_value={
                    "vehicle_id": "VEH-001",
                    "linked_driver_ids": ["DRV-001"],
                }
            ),
        )
    )
    REG_SVC.unlink_driver = AsyncMock(
        return_value=MagicMock(
            vehicle_id="VEH-001",
            linked_driver_ids=[],
            model_dump=MagicMock(
                return_value={
                    "vehicle_id": "VEH-001",
                    "linked_driver_ids": [],
                }
            ),
        )
    )

    PROFILE_SVC = MagicMock()
    PROFILE_SVC.get_driver = AsyncMock(
        return_value=MagicMock(
            driver_id="DRV-001",
            full_name="John Doe",
            status="active",
            model_dump=MagicMock(
                return_value={
                    "driver_id": "DRV-001",
                    "full_name": "John Doe",
                    "status": "active",
                }
            ),
        )
    )
    PROFILE_SVC.get_all_drivers = AsyncMock(return_value=[])
    PROFILE_SVC.update_driver = AsyncMock(
        return_value=MagicMock(
            driver_id="DRV-001",
            full_name="John Updated",
            model_dump=MagicMock(
                return_value={
                    "driver_id": "DRV-001",
                    "full_name": "John Updated",
                }
            ),
        )
    )
    PROFILE_SVC.delete_driver = AsyncMock(return_value=True)
    PROFILE_SVC.get_vehicle_by_plate = AsyncMock(
        return_value=MagicMock(
            vehicle_id="VEH-001",
            plate_number="ABC-1234",
            registration_status="active",
            model_dump=MagicMock(
                return_value={
                    "vehicle_id": "VEH-001",
                    "plate_number": "ABC-1234",
                    "registration_status": "active",
                }
            ),
        )
    )
    PROFILE_SVC.get_vehicle_by_id = AsyncMock(
        return_value=MagicMock(
            vehicle_id="VEH-001",
            plate_number="ABC-1234",
            model_dump=MagicMock(
                return_value={
                    "vehicle_id": "VEH-001",
                    "plate_number": "ABC-1234",
                }
            ),
        )
    )
    PROFILE_SVC.get_all_vehicles = AsyncMock(return_value=[])
    PROFILE_SVC.update_vehicle = AsyncMock(
        return_value=MagicMock(
            vehicle_id="VEH-001",
            make="Toyota",
            model_dump=MagicMock(
                return_value={
                    "vehicle_id": "VEH-001",
                    "make": "Toyota",
                }
            ),
        )
    )
    PROFILE_SVC.delete_vehicle = AsyncMock(return_value=True)

    with patch("app.api.v1.identity.routes.PROFILE_SVC", PROFILE_SVC):
        yield


@pytest.fixture(autouse=True)
def mock_access_policy():
    with patch("app.api.v1.identity.routes.AccessPolicy") as mock_ap:
        mock_ap.return_value = MagicMock()
        yield


@pytest.fixture(autouse=True)
def mock_repos_and_policy():
    POLICY_REPO.get_all = AsyncMock(return_value=[])

    mock_policy = MagicMock(
        policy_id="POL-001",
        target_type="vehicle",
        target_id="VEH-001",
        allowed_days=["mon", "tue", "wed", "thu", "fri"],
        allowed_time_ranges=[{"start": "08:00", "end": "18:00"}],
        expiration_date=None,
        maximum_entries_per_day=None,
        blacklist=False,
        notes="Test policy",
        model_dump=MagicMock(
            return_value={
                "policy_id": "POL-001",
                "target_type": "vehicle",
                "target_id": "VEH-001",
                "allowed_days": ["mon", "tue", "wed", "thu", "fri"],
                "allowed_time_ranges": [{"start": "08:00", "end": "18:00"}],
                "expiration_date": None,
                "maximum_entries_per_day": None,
                "blacklist": False,
                "notes": "Test policy",
            }
        ),
    )

    POLICY_SVC = MagicMock()
    POLICY_SVC.create_policy = AsyncMock(return_value=mock_policy)
    POLICY_SVC.get_policy = AsyncMock(return_value=mock_policy)
    POLICY_SVC.update_policy = AsyncMock(return_value=mock_policy)
    POLICY_SVC.delete_policy = AsyncMock(return_value=True)

    with patch("app.api.v1.identity.routes.POLICY_SVC", POLICY_SVC):
        yield


@pytest.fixture(autouse=True)
def mock_verify():
    VERIFY_SVC.verify = AsyncMock(
        return_value=MagicMock(
            to_dict=MagicMock(
                return_value={
                    "plate_found": True,
                    "vehicle": {
                        "vehicle_id": "VEH-001",
                        "plate_number": "ABC-1234",
                        "status": "active",
                        "linked_drivers": ["DRV-001"],
                    },
                    "driver_found": True,
                    "driver": {
                        "driver_id": "DRV-001",
                        "full_name": "John Doe",
                        "status": "active",
                    },
                    "policy_evaluation": {"allowed": True, "reason": "Access permitted by policy"},
                    "face_match": True,
                    "face_confidence": 0.88,
                    "vehicle_match": True,
                    "vehicle_confidence": 0.92,
                }
            ),
        )
    )


@pytest.fixture
def app():
    application = FastAPI()
    application.include_router(router)
    return application


def test_routes_import():
    assert router is not None


# ── Drivers ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_driver(app):
    transport = ASGITransport(app=app)
    payload = {
        "driver_id": "DRV-001",
        "full_name": "John Doe",
        "email": "john@test.com",
        "phone": "1234567890",
        "department": "Engineering",
    }
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/identity/drivers", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["driver_id"] == "DRV-001"


@pytest.mark.asyncio
async def test_list_drivers(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/identity/drivers")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_get_driver(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/identity/driver/DRV-001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["driver_id"] == "DRV-001"


@pytest.mark.asyncio
async def test_get_driver_not_found(app):
    transport = ASGITransport(app=app)
    PROFILE_SVC = None
    with patch("app.api.v1.identity.routes.PROFILE_SVC") as mock_ps:
        mock_svc = MagicMock()
        mock_svc.get_driver = AsyncMock(return_value=None)
        with patch(
            "app.api.v1.identity.routes.PROFILE_SVC", mock_svc
        ):
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                resp = await ac.get("/identity/driver/NONEXIST")
                assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_driver(app):
    transport = ASGITransport(app=app)
    payload = {"full_name": "John Updated"}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.put("/identity/drivers/DRV-001", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_store_face_embedding(app):
    transport = ASGITransport(app=app)
    payload = [0.1, 0.2, 0.3]
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.put("/identity/drivers/DRV-001/face-embedding", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_delete_driver(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.delete("/identity/driver/DRV-001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


# ── Vehicles ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_vehicle(app):
    transport = ASGITransport(app=app)
    payload = {
        "vehicle_id": "VEH-001",
        "plate_number": "ABC-1234",
    }
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/identity/vehicles", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["plate_number"] == "ABC-1234"


@pytest.mark.asyncio
async def test_list_vehicles(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/identity/vehicles")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_get_vehicle_by_plate(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/identity/vehicle/ABC-1234")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["plate_number"] == "ABC-1234"


@pytest.mark.asyncio
async def test_get_vehicle_by_id(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/identity/vehicles/VEH-001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_update_vehicle(app):
    transport = ASGITransport(app=app)
    payload = {"make": "Toyota"}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.put("/identity/vehicles/VEH-001", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_store_vehicle_embedding(app):
    transport = ASGITransport(app=app)
    payload = [0.1, 0.2, 0.3]
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.put(
            "/identity/vehicles/VEH-001/vehicle-embedding", json=payload
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_delete_vehicle(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.delete("/identity/vehicle/VEH-001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


# ── Linking ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_link_drivers(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/identity/link?vehicle_id=VEH-001&driver_ids=DRV-001"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "DRV-001" in data["data"]["linked_driver_ids"]


@pytest.mark.asyncio
async def test_unlink_driver(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/identity/unlink?vehicle_id=VEH-001&driver_id=DRV-001"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


# ── Policies ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_policy(app):
    transport = ASGITransport(app=app)
    payload = {
        "policy_id": "POL-001",
        "target_type": "vehicle",
        "target_id": "VEH-001",
    }
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/identity/policies", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["policy_id"] == "POL-001"


@pytest.mark.asyncio
async def test_list_policies(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/identity/policies")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_get_policy(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/identity/policies/POL-001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["policy_id"] == "POL-001"


@pytest.mark.asyncio
async def test_update_policy(app):
    transport = ASGITransport(app=app)
    payload = {"notes": "Updated notes"}
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.put("/identity/policies/POL-001", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


@pytest.mark.asyncio
async def test_delete_policy(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.delete("/identity/policies/POL-001")
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True


# ── Verification ─────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_verify(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post(
            "/identity/verify",
            params={"plate_text": "ABC-1234"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert data["data"]["plate_found"] is True
        assert data["data"]["driver_found"] is True
