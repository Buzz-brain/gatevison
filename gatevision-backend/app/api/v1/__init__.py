from fastapi import APIRouter

from app.api.v1.auth.routes import router as auth_router
from app.api.v1.users.routes import router as users_router
from app.api.v1.vehicles.routes import router as vehicles_router
from app.api.v1.entries.routes import router as entries_router
from app.api.v1.exits.routes import router as exits_router
from app.api.v1.logs.routes import router as logs_router
from app.api.v1.dashboard.routes import router as dashboard_router
from app.api.v1.camera.routes import router as camera_router
from app.api.v1.storage.routes import router as storage_router
from app.api.v1.plate_detection.routes import router as plate_detection_router
from app.api.v1.ocr.routes import router as ocr_router
from app.api.v1.pipeline.routes import router as pipeline_router
from app.api.v1.face.routes import router as face_router
from app.api.v1.vehicle.routes import router as vehicle_fingerprint_router
from app.api.v1.decision.routes import router as decision_router
from app.api.v1.identity.routes import router as identity_router
from app.api.v1.gate.routes import router as gate_router
from app.api.v1.admin.routes import router as admin_router
from app.api.v1.system.routes import router as system_router
v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router)
v1_router.include_router(users_router)
v1_router.include_router(vehicles_router)
v1_router.include_router(entries_router)
v1_router.include_router(exits_router)
v1_router.include_router(logs_router)
v1_router.include_router(dashboard_router)
v1_router.include_router(camera_router)
v1_router.include_router(storage_router)
v1_router.include_router(plate_detection_router)
v1_router.include_router(ocr_router)
v1_router.include_router(pipeline_router)
v1_router.include_router(face_router)
v1_router.include_router(vehicle_fingerprint_router)
v1_router.include_router(decision_router)
v1_router.include_router(identity_router)
v1_router.include_router(gate_router)
v1_router.include_router(admin_router)
v1_router.include_router(system_router)
