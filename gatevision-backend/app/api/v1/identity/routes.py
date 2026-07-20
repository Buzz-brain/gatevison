import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.access_policy import AccessPolicy
from app.models.driver_profile import DriverProfile
from app.models.vehicle_profile import VehicleProfile
from app.repositories.access_policy_repository import AccessPolicyRepository
from app.repositories.driver_profile_repository import DriverProfileRepository
from app.repositories.vehicle_profile_repository import VehicleProfileRepository
from app.schemas.access_policy import (
    AccessPolicyCreate,
    AccessPolicyResponse,
    AccessPolicyUpdate,
)
from app.schemas.driver_profile import (
    DriverProfileCreate,
    DriverProfileResponse,
    DriverProfileUpdate,
)
from app.schemas.vehicle_profile import (
    LinkDriversRequest,
    VehicleProfileCreate,
    VehicleProfileResponse,
    VehicleProfileUpdate,
)
from app.services.identity.policy_service import PolicyService
from app.services.identity.profile_service import ProfileService
from app.services.identity.registration_service import RegistrationService
from app.services.identity.verification_service import VerificationService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/identity", tags=["Identity"])

REG_SVC = RegistrationService()
PROFILE_SVC = ProfileService()
POLICY_SVC = PolicyService()
VERIFY_SVC = VerificationService()
DRIVER_REPO = DriverProfileRepository()
VEHICLE_REPO = VehicleProfileRepository()
POLICY_REPO = AccessPolicyRepository()


# ── Drivers ──────────────────────────────────────────────────────

@router.post("/drivers")
async def create_driver(body: DriverProfileCreate):
    try:
        profile = await REG_SVC.register_driver(
            driver_id=body.driver_id,
            full_name=body.full_name,
            email=body.email,
            phone=body.phone,
            department=body.department,
            status=body.status,
        )
        return {
            "success": True,
            "message": "Driver created",
            "data": profile.model_dump(by_alias=True),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/drivers")
async def list_drivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    profiles = await PROFILE_SVC.get_all_drivers(skip=skip, limit=limit)
    return {
        "success": True,
        "message": "Drivers retrieved",
        "data": [p.model_dump(by_alias=True) for p in profiles],
    }


@router.get("/driver/{driver_id}")
async def get_driver(driver_id: str):
    profile = await PROFILE_SVC.get_driver(driver_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {
        "success": True,
        "message": "Driver retrieved",
        "data": profile.model_dump(by_alias=True),
    }


@router.put("/drivers/{driver_id}")
async def update_driver(driver_id: str, body: DriverProfileUpdate):
    updates = body.model_dump(exclude_none=True)
    profile = await PROFILE_SVC.update_driver(driver_id, updates)
    if not profile:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {
        "success": True,
        "message": "Driver updated",
        "data": profile.model_dump(by_alias=True),
    }


@router.put("/drivers/{driver_id}/face-embedding")
async def store_face_embedding(driver_id: str, embedding: list[float]):
    try:
        profile = await REG_SVC.store_face_embedding(driver_id, embedding)
        return {
            "success": True,
            "message": "Face embedding stored",
            "data": profile.model_dump(by_alias=True),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/driver/{driver_id}")
async def delete_driver(driver_id: str):
    deleted = await PROFILE_SVC.delete_driver(driver_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Driver not found")
    return {"success": True, "message": "Driver deleted"}


# ── Vehicles ─────────────────────────────────────────────────────

@router.post("/vehicles")
async def create_vehicle(body: VehicleProfileCreate):
    try:
        profile = await REG_SVC.register_vehicle(
            vehicle_id=body.vehicle_id,
            plate_number=body.plate_number,
            make=body.make,
            model=body.model,
            color=body.color,
            year=body.year,
            owner_id=body.owner_id,
            registration_status=body.registration_status,
        )
        return {
            "success": True,
            "message": "Vehicle created",
            "data": profile.model_dump(by_alias=True),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/vehicles")
async def list_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    profiles = await PROFILE_SVC.get_all_vehicles(skip=skip, limit=limit)
    return {
        "success": True,
        "message": "Vehicles retrieved",
        "data": [p.model_dump(by_alias=True) for p in profiles],
    }


@router.get("/vehicle/{plate}")
async def get_vehicle_by_plate(plate: str):
    profile = await PROFILE_SVC.get_vehicle_by_plate(plate)
    if not profile:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {
        "success": True,
        "message": "Vehicle retrieved",
        "data": profile.model_dump(by_alias=True),
    }


@router.get("/vehicles/{vehicle_id}")
async def get_vehicle_by_id(vehicle_id: str):
    profile = await PROFILE_SVC.get_vehicle_by_id(vehicle_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {
        "success": True,
        "message": "Vehicle retrieved",
        "data": profile.model_dump(by_alias=True),
    }


@router.put("/vehicles/{vehicle_id}")
async def update_vehicle(vehicle_id: str, body: VehicleProfileUpdate):
    updates = body.model_dump(exclude_none=True)
    profile = await PROFILE_SVC.update_vehicle(vehicle_id, updates)
    if not profile:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {
        "success": True,
        "message": "Vehicle updated",
        "data": profile.model_dump(by_alias=True),
    }


@router.put("/vehicles/{vehicle_id}/vehicle-embedding")
async def store_vehicle_embedding(vehicle_id: str, embedding: list[float]):
    try:
        profile = await REG_SVC.store_vehicle_embedding(vehicle_id, embedding)
        return {
            "success": True,
            "message": "Vehicle embedding stored",
            "data": profile.model_dump(by_alias=True),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/vehicle/{vehicle_id}")
async def delete_vehicle(vehicle_id: str):
    deleted = await PROFILE_SVC.delete_vehicle(vehicle_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"success": True, "message": "Vehicle deleted"}


# ── Linking ──────────────────────────────────────────────────────

@router.post("/link")
async def link_drivers(vehicle_id: str = Query(...), driver_ids: list[str] = Query(...)):
    try:
        profile = await REG_SVC.link_drivers(vehicle_id, driver_ids)
        return {
            "success": True,
            "message": "Drivers linked",
            "data": profile.model_dump(by_alias=True),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/unlink")
async def unlink_driver(vehicle_id: str = Query(...), driver_id: str = Query(...)):
    try:
        profile = await REG_SVC.unlink_driver(vehicle_id, driver_id)
        return {
            "success": True,
            "message": "Driver unlinked",
            "data": profile.model_dump(by_alias=True),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Access Policies ──────────────────────────────────────────────

@router.post("/policies")
async def create_policy(body: AccessPolicyCreate):
    try:
        policy = AccessPolicy(
            policy_id=body.policy_id,
            target_type=body.target_type,
            target_id=body.target_id,
            allowed_days=body.allowed_days,
            allowed_time_ranges=body.allowed_time_ranges,
            expiration_date=body.expiration_date,
            maximum_entries_per_day=body.maximum_entries_per_day,
            blacklist=body.blacklist,
            notes=body.notes,
        )
        result = await POLICY_SVC.create_policy(policy)
        return {
            "success": True,
            "message": "Policy created",
            "data": result.model_dump(by_alias=True),
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/policies")
async def list_policies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    policies = await POLICY_REPO.get_all(skip=skip, limit=limit)
    return {
        "success": True,
        "message": "Policies retrieved",
        "data": [p.model_dump(by_alias=True) for p in policies],
    }


@router.get("/policies/{policy_id}")
async def get_policy(policy_id: str):
    policy = await POLICY_SVC.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {
        "success": True,
        "message": "Policy retrieved",
        "data": policy.model_dump(by_alias=True),
    }


@router.put("/policies/{policy_id}")
async def update_policy(policy_id: str, body: AccessPolicyUpdate):
    updates = body.model_dump(exclude_none=True)
    policy = await POLICY_SVC.update_policy(policy_id, updates)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {
        "success": True,
        "message": "Policy updated",
        "data": policy.model_dump(by_alias=True),
    }


@router.delete("/policies/{policy_id}")
async def delete_policy(policy_id: str):
    deleted = await POLICY_SVC.delete_policy(policy_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"success": True, "message": "Policy deleted"}


# ── Verification ─────────────────────────────────────────────────

@router.post("/verify")
async def verify_identity(
    plate_text: str = Query(...),
    face_embedding: Optional[list[float]] = Query(None),
    vehicle_embedding: Optional[list[float]] = Query(None),
):
    try:
        result = await VERIFY_SVC.verify(
            plate_text=plate_text,
            face_embedding=face_embedding,
            vehicle_embedding=vehicle_embedding,
        )
        return {
            "success": True,
            "message": "Verification completed",
            "data": result.to_dict(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
