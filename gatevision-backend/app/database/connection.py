import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

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

logger = logging.getLogger(__name__)
client: AsyncIOMotorClient = None


async def init_database():
    global client
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI)
        await init_beanie(
            database=client[settings.DATABASE_NAME],
            document_models=[
                User, Image, PlateDetection, OcrResult, FaceRecord,
                SystemHealth, SystemBackup,
                DecisionRecord, DriverProfile, VehicleProfile,
                AccessPolicy, GateSession, GateTransaction,
                ManualReview, SystemEvent, VehicleFingerprint,
            ],
        )
        logger.info("Database connected successfully")
        return client
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise


async def close_database():
    global client
    if client:
        client.close()
        logger.info("Database connection closed")


def get_database():
    return client[settings.DATABASE_NAME] if client else None
