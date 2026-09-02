import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.config.settings import settings
from app.models.pending_vehicle import PendingVehicle
from app.repositories.pending_vehicle_repository import PendingVehicleRepository
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.orchestrator.pipeline_result import PipelineResult

logger = logging.getLogger(__name__)


class PendingVehicleService:
    """Manages the two-camera fusion hand-off.

    The system webcam scans a vehicle (plate + vehicle fingerprint) and stores
    it as a pending record. An operator phone (Live Gate via ngrok) later reads
    the latest pending record, captures the driver's face, and completes the
    identity check - at which point the record is consumed (deleted).
    """

    def __init__(self):
        self.repository = PendingVehicleRepository

    def _frame_jpeg(self, frame) -> bytes:
        frame = FrameProcessor.resize_by_max(frame, settings.PENDING_VEHICLE_MAX_FRAME_DIM)
        return FrameProcessor.to_bytes(frame, ".jpg")

    def _pick_plate(self, result: PipelineResult) -> str:
        """Prefer a validated plate, else the highest-confidence read."""
        plates = [p for p in result.recognized_plates if p.get("plate")]
        if not plates:
            return ""
        valid = [p for p in plates if p.get("validation_status") == "valid"]
        pool = valid or plates
        return sorted(pool, key=lambda p: -float(p.get("confidence", 0.0)))[0]["plate"]

    async def create_from_result(
        self,
        result: PipelineResult,
        direction: str = "entry",
        frame=None,
        source: str = "camera",
    ) -> PendingVehicle:
        if frame is None:
            raise ValueError("No vehicle frame available to store")

        record = PendingVehicle(
            source=source,
            frame=self._frame_jpeg(frame),
            plate_text=self._pick_plate(result),
            direction=direction,
            vehicles_detected=len(getattr(result, "detected_plates", []) or []),
            processing_time_ms=getattr(result, "total_processing_time", 0.0),
            expires_at=datetime.now(timezone.utc)
            + timedelta(seconds=settings.PENDING_VEHICLE_TTL_SECONDS),
        )
        created = await self.repository.create(record)
        logger.info(
            "Pending vehicle stored | event=pending_vehicle_created "
            "| id=%s | plate=%r | direction=%s | ttl=%.0fs",
            getattr(created, "id", None),
            getattr(created, "plate_text", None),
            getattr(created, "direction", None),
            settings.PENDING_VEHICLE_TTL_SECONDS,
        )
        return created

    async def get_latest(self, direction: str = "entry") -> Optional[PendingVehicle]:
        try:
            await self.repository.delete_expired()
        except Exception as e:
            logger.warning(
                "Pending vehicle expiry prune failed: %s | event=pending_vehicle_prune_failed",
                e,
            )
        return await self.repository.find_latest(direction=direction)

    async def consume(self, record_id: str) -> bool:
        try:
            return await self.repository.delete(record_id)
        except Exception as e:
            logger.warning(
                "Pending vehicle consume failed: %s | event=pending_vehicle_consume_failed",
                e,
            )
            return False

    @staticmethod
    def to_dict(record: Optional[PendingVehicle]) -> Optional[dict]:
        if record is None:
            return None
        info = {
            "id": str(getattr(record, "id", "")),
            "source": getattr(record, "source", "camera"),
            "plate_text": getattr(record, "plate_text", ""),
            "direction": getattr(record, "direction", "entry"),
            "vehicles_detected": getattr(record, "vehicles_detected", 0),
            "processing_time_ms": round(
                float(getattr(record, "processing_time_ms", 0.0)), 2
            ),
            "created_at": (
                getattr(record, "created_at", None).isoformat()
                if getattr(record, "created_at", None)
                else None
            ),
            "expires_at": (
                getattr(record, "expires_at", None).isoformat()
                if getattr(record, "expires_at", None)
                else None
            ),
        }
        return info