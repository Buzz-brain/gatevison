import logging
import os
import shutil
from pathlib import Path

from app.config.settings import settings
from app.models.image import Image
from app.models.system_event import SystemEvent
from app.services.system.system_logger import system_logger

logger = logging.getLogger(__name__)


class CleanupService:
    def __init__(self) -> None:
        self._upload_dir: Path = settings.BASE_DIR / settings.UPLOAD_DIR

    async def cleanup(self) -> dict:
        system_logger.cleanup_started()
        deleted_temp = 0
        deleted_empty_dirs = 0
        freed_bytes = 0

        temp_dir = self._upload_dir / "temp"
        orphaned = await self._find_orphaned_files()
        orphaned_set = set(orphaned)

        for f in list(orphaned_set):
            try:
                path = self._upload_dir / f
                if path.exists() and path.is_file():
                    size = path.stat().st_size
                    path.unlink()
                    freed_bytes += size
                    deleted_temp += 1
            except Exception as e:
                logger.warning(f"Failed to delete orphaned: {f}: {e}")

        for dirpath_str, dirnames, filenames in os.walk(str(self._upload_dir), topdown=False):
            if not filenames and not dirnames:
                try:
                    os.rmdir(dirpath_str)
                    deleted_empty_dirs += 1
                except Exception:
                    pass

        if temp_dir.exists():
            for f in temp_dir.iterdir():
                if f.is_file():
                    try:
                        freed_bytes += f.stat().st_size
                        f.unlink()
                        deleted_temp += 1
                    except Exception as e:
                        logger.warning(f"Failed to delete temp: {f}: {e}")

        try:
            event = SystemEvent(
                event_type="cleanup",
                severity="info",
                source="system",
                description=f"Cleanup completed: removed {deleted_temp} orphaned/temp files, "
                            f"{deleted_empty_dirs} empty dirs, freed {freed_bytes} bytes",
            )
            await event.insert()
        except Exception:
            pass

        system_logger.cleanup_completed(deleted_temp + deleted_empty_dirs, freed_bytes)
        return {
            "deleted_files": deleted_temp + deleted_empty_dirs,
            "deleted_temp_files": deleted_temp,
            "deleted_empty_dirs": deleted_empty_dirs,
            "freed_bytes": freed_bytes,
        }

    async def _find_orphaned_files(self) -> list[str]:
        if not self._upload_dir.exists():
            return []

        all_db_paths = set()
        try:
            async for img in Image.find_all():
                normalized = img.filepath.replace("\\", "/").lstrip("/")
                all_db_paths.add(normalized)
        except Exception:
            pass

        orphaned = []
        for f in self._upload_dir.rglob("*"):
            if f.is_file():
                rel = str(f.relative_to(self._upload_dir)).replace("\\", "/")
                if rel not in all_db_paths:
                    orphaned.append(rel)
        return orphaned


cleanup_service = CleanupService()
