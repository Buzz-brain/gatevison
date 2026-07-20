import hashlib
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from beanie import Document

from app.config.settings import settings
from app.models.access_policy import AccessPolicy
from app.models.decision_record import DecisionRecord
from app.models.driver_profile import DriverProfile
from app.models.gate_session import GateSession
from app.models.gate_transaction import GateTransaction
from app.models.manual_review import ManualReview
from app.models.user import User
from app.models.vehicle_profile import VehicleProfile
from app.services.system.system_logger import system_logger
from app.services.system.configuration_service import ConfigurationService

logger = logging.getLogger(__name__)

COLLECTION_MODELS: dict[str, type[Document]] = {
    "users": User,
    "drivers": DriverProfile,
    "vehicles": VehicleProfile,
    "policies": AccessPolicy,
    "sessions": GateSession,
    "transactions": GateTransaction,
    "decisions": DecisionRecord,
    "reviews": ManualReview,
}


class BackupService:
    def __init__(self) -> None:
        self._backup_dir: Path = settings.BASE_DIR / "backups"
        self._backup_dir.mkdir(parents=True, exist_ok=True)
        self._config_service = ConfigurationService()

    async def export_database(
        self, collections: Optional[list[str]] = None
    ) -> dict:
        system_logger.backup_started("database", "")
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"gatevision_backup_{timestamp}.json"
        filepath = self._backup_dir / filename

        target_collections = collections or list(COLLECTION_MODELS.keys())
        backup_data: dict[str, list[dict]] = {}
        total_records = 0

        for name in target_collections:
            model = COLLECTION_MODELS.get(name)
            if model is None:
                logger.warning(f"Unknown collection: {name}, skipping")
                continue
            try:
                records = []
                async for doc in model.find_all():
                    d = doc.model_dump(by_alias=True)
                    d["_id"] = str(d["_id"])
                    records.append(d)
                backup_data[name] = records
                total_records += len(records)
            except Exception as e:
                logger.error(f"Failed to export {name}: {e}")
                backup_data[name] = []

        backup_data["_metadata"] = {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "version": settings.VERSION,
            "collections": target_collections,
            "total_records": total_records,
        }

        raw = json.dumps(backup_data, default=str, indent=2)
        filepath.write_text(raw, encoding="utf-8")
        checksum = hashlib.sha256(raw.encode()).hexdigest()
        size = filepath.stat().st_size

        system_logger.backup_completed("database", filename, total_records)
        return {
            "success": True,
            "message": f"Database exported to {filename}",
            "filename": filename,
            "collections": target_collections,
            "record_count": total_records,
            "size_bytes": size,
            "checksum": checksum,
        }

    async def import_database(self, filename: str) -> dict:
        filepath = self._backup_dir / filename
        if not filepath.exists():
            return {
                "success": False,
                "message": f"Backup file not found: {filename}",
                "collections_imported": [],
                "total_records": 0,
                "errors": [f"File not found: {filepath}"],
            }

        system_logger.backup_started("import", filename)
        errors: list[str] = []
        collections_imported: list[str] = []
        total_records = 0

        try:
            raw = filepath.read_text(encoding="utf-8")
            backup_data = json.loads(raw)
        except Exception as e:
            system_logger.backup_failed("import", str(e))
            return {
                "success": False,
                "message": f"Failed to read backup file: {e}",
                "collections_imported": [],
                "total_records": 0,
                "errors": [str(e)],
            }

        for name, records in backup_data.items():
            if name == "_metadata":
                continue
            model = COLLECTION_MODELS.get(name)
            if model is None:
                errors.append(f"Unknown collection: {name}")
                continue
            try:
                imported = 0
                for record_data in records:
                    if "_id" in record_data:
                        del record_data["_id"]
                    try:
                        doc = model(**record_data)
                        await doc.insert()
                        imported += 1
                    except Exception as e:
                        errors.append(f"Failed to import {name} record: {e}")
                total_records += imported
                collections_imported.append(name)
                logger.info(f"Imported {imported} records into {name}")
            except Exception as e:
                errors.append(f"Failed to import collection {name}: {e}")

        system_logger.backup_completed("import", filename, total_records)
        return {
            "success": True,
            "message": f"Import completed from {filename}",
            "collections_imported": collections_imported,
            "total_records": total_records,
            "errors": errors,
        }

    async def export_configuration(self) -> dict:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        filename = f"gatevision_config_{timestamp}.json"
        filepath = self._backup_dir / filename

        config = self._config_service.get_configuration()
        config_data = {
            "_metadata": {
                "exported_at": datetime.now(timezone.utc).isoformat(),
                "type": "configuration",
                "version": settings.VERSION,
            },
            "configuration": config,
        }

        raw = json.dumps(config_data, default=str, indent=2)
        filepath.write_text(raw, encoding="utf-8")
        size = filepath.stat().st_size

        return {
            "success": True,
            "message": f"Configuration exported to {filename}",
            "filename": filename,
            "collections": ["configuration"],
            "record_count": 1,
            "size_bytes": size,
        }

    def list_backups(self) -> list[dict]:
        if not self._backup_dir.exists():
            return []
        backups = []
        for f in sorted(self._backup_dir.iterdir(), key=os.path.getmtime, reverse=True):
            if f.is_file() and f.suffix == ".json":
                backups.append({
                    "filename": f.name,
                    "size_bytes": f.stat().st_size,
                    "created_at": datetime.fromtimestamp(
                        f.stat().st_mtime, tz=timezone.utc
                    ).isoformat(),
                })
        return backups


backup_service = BackupService()
