from datetime import datetime
import logging
from typing import Optional

from app.models.vehicle_record import VehicleFingerprint

logger = logging.getLogger(__name__)


class VehicleRepository:
    @staticmethod
    async def create(plate_text: str, embedding: list[float]) -> VehicleFingerprint:
        record = VehicleFingerprint(
            plate_text=plate_text,
            embedding=embedding,
            dimension=len(embedding),
        )
        return await record.insert()

    @staticmethod
    async def find_by_plate(plate_text: str) -> Optional[VehicleFingerprint]:
        return await VehicleFingerprint.find_one(
            VehicleFingerprint.plate_text == plate_text
        )

    @staticmethod
    async def get_all() -> list[VehicleFingerprint]:
        return await VehicleFingerprint.find_all().to_list()

    @staticmethod
    async def update(record: VehicleFingerprint) -> VehicleFingerprint:
        record.updated_at = datetime.utcnow()
        return await record.save()

    @staticmethod
    async def delete_by_plate(plate_text: str) -> bool:
        record = await VehicleFingerprint.find_one(
            VehicleFingerprint.plate_text == plate_text
        )
        if record is None:
            return False
        await record.delete()
        return True

    @staticmethod
    async def count() -> int:
        return await VehicleFingerprint.find_all().count()
