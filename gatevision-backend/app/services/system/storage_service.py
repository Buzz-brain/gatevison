import logging
import shutil
from pathlib import Path
from typing import Optional

from app.config.settings import settings
from app.models.image import Image, ImageCategory

logger = logging.getLogger(__name__)


class SystemStorageService:
    def __init__(self) -> None:
        self._upload_dir: Path = settings.BASE_DIR / settings.UPLOAD_DIR

    async def get_storage_info(self) -> dict:
        if not self._upload_dir.exists():
            return {
                "upload_directory_size_bytes": 0,
                "total_images": 0,
                "images_by_category": {},
                "total_cropped_plates": 0,
                "total_cropped_faces": 0,
                "total_vehicle_images": 0,
                "orphaned_files": 0,
                "available_disk_space_bytes": 0,
            }

        total_size = sum(f.stat().st_size for f in self._upload_dir.rglob("*") if f.is_file())
        disk_usage = shutil.disk_usage(self._upload_dir)

        category_counts = {}
        for cat in ImageCategory:
            try:
                count = await Image.find(Image.category == cat).count()
                category_counts[cat.value] = count
            except Exception:
                category_counts[cat.value] = 0

        total_images = sum(category_counts.values())
        plates = category_counts.get(ImageCategory.PLATE.value, 0)
        faces = category_counts.get(ImageCategory.FACE.value, 0)
        vehicles = category_counts.get(ImageCategory.VEHICLE.value, 0)

        all_db_paths = set()
        try:
            async for img in Image.find_all():
                all_db_paths.add(img.filepath.replace("\\", "/"))
        except Exception:
            pass

        orphaned = 0
        if self._upload_dir.exists():
            for f in self._upload_dir.rglob("*"):
                if f.is_file():
                    rel = str(f.relative_to(self._upload_dir)).replace("\\", "/")
                    if rel not in all_db_paths:
                        orphaned += 1

        return {
            "upload_directory_size_bytes": total_size,
            "total_images": total_images,
            "images_by_category": category_counts,
            "total_cropped_plates": plates,
            "total_cropped_faces": faces,
            "total_vehicle_images": vehicles,
            "orphaned_files": orphaned,
            "available_disk_space_bytes": disk_usage.free,
        }


system_storage_service = SystemStorageService()
