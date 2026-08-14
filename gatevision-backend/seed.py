import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.database.connection import _patch_motor_append_metadata
from app.config.settings import settings
from app.models.user import User
from app.models.image import Image
from app.models.plate_detection import PlateDetection
from app.models.ocr_result import OcrResult
from app.models.face_record import FaceRecord
from app.models.system_health import SystemHealth
from app.models.system_backup import SystemBackup
from app.models.decision_record import DecisionRecord
from app.models.driver_profile import DriverProfile
from app.models.vehicle_profile import VehicleProfile
from app.models.access_policy import AccessPolicy
from app.models.gate_session import GateSession
from app.models.gate_transaction import GateTransaction
from app.models.manual_review import ManualReview
from app.models.system_event import SystemEvent
from app.models.vehicle_record import VehicleFingerprint
from app.security.password import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")


async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    await init_beanie(
        database=client[settings.DATABASE_NAME],
        document_models=[
            User, Image, PlateDetection, OcrResult, FaceRecord,
            SystemHealth, SystemBackup, DecisionRecord,
            DriverProfile, VehicleProfile, AccessPolicy,
            GateSession, GateTransaction, ManualReview,
            SystemEvent, VehicleFingerprint,
        ],
    )

    existing = await User.find_one(User.email == "admin@gatevision.ai")
    if existing:
        logger.info("Admin user already exists, skipping seed")
    else:
        admin = User(
            first_name="Admin",
            last_name="User",
            email="admin@gatevision.ai",
            password=hash_password("admin123"),
            role="admin",
            is_active=True,
        )
        await admin.insert()
        logger.info("Created admin user: admin@gatevision.ai / admin123")

    client.close()
    logger.info("Seed complete")


if __name__ == "__main__":
    asyncio.run(seed())
