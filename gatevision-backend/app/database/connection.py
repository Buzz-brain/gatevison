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


def _patch_motor_append_metadata() -> None:
    """Compatibility shim for beanie 2.1.0 + motor 3.7.1.

    beanie calls `client.append_metadata(metadata)` on init, but motor's
    AsyncIOMotorClient does not forward that pymongo method - its __getattr__
    proxies unknown attributes to database objects. Forward it to the
    underlying pymongo delegate instead.
    """
    if not hasattr(AsyncIOMotorClient, "append_metadata"):
        def append_metadata(self, metadata):
            return self.delegate.append_metadata(metadata)

        AsyncIOMotorClient.append_metadata = append_metadata


def _patch_motor_cursor_await() -> None:
    """Compatibility shim for beanie 2.1.0 + motor 3.x.

    beanie's AggregationQuery.get_cursor does `await collection.aggregate(...)`
    expecting an awaitable cursor, but motor 3.x returns a latent cursor that is
    not awaitable. Make awaiting a cursor return the cursor itself so beanie's
    get_cursor works unchanged.
    """
    import motor.core as motor_core
    import motor.motor_asyncio as motor_asyncio

    def _make_await_self():
        async def _return_self(self):
            return self

        def __await__(self):
            return _return_self(self).__await__()

        return __await__

    for cursor_cls in (
        motor_core.AgnosticLatentCommandCursor,
        motor_core.AgnosticCommandCursor,
        getattr(motor_asyncio, "AsyncIOMotorLatentCommandCursor", None),
        getattr(motor_asyncio, "AsyncIOMotorCommandCursor", None),
        getattr(motor_asyncio, "AsyncIOMotorCursor", None),
    ):
        if cursor_cls is None:
            continue
        if "__await__" not in cursor_cls.__dict__:
            cursor_cls.__await__ = _make_await_self()


_patch_motor_append_metadata()
_patch_motor_cursor_await()


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
