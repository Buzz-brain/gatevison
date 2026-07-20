import logging
import uuid
from pathlib import Path
from typing import Optional

from app.config.settings import settings

logger = logging.getLogger(__name__)

CATEGORY_DIRS = {
    "entry": "entry",
    "exit": "exit",
    "face": "faces",
    "vehicle": "vehicles",
    "plate": "plates",
    "temp": "temp",
}


class ImageStorageService:
    def __init__(self):
        self.base_dir: Path = settings.BASE_DIR / settings.UPLOAD_DIR
        self._ensure_directories()

    def _ensure_directories(self):
        for subdir in CATEGORY_DIRS.values():
            (self.base_dir / subdir).mkdir(parents=True, exist_ok=True)
        logger.info(f"Storage directories ensured at {self.base_dir}")

    def generate_filename(self, category: str, extension: str = "jpg") -> str:
        unique_id = uuid.uuid4().hex
        return f"{unique_id}.{extension}"

    def get_category_dir(self, category: str) -> Path:
        subdir = CATEGORY_DIRS.get(category, "temp")
        return self.base_dir / subdir

    def get_full_path(self, category: str, filename: str) -> Path:
        return self.get_category_dir(category) / filename

    def save(self, data: bytes, category: str, filename: Optional[str] = None) -> dict:
        if filename is None:
            filename = self.generate_filename(category)
        filepath = self.get_full_path(category, filename)
        if filepath.exists():
            name_stem = filepath.stem
            extension = filepath.suffix
            filename = f"{name_stem}_{uuid.uuid4().hex[:8]}{extension}"
            filepath = self.get_full_path(category, filename)
        filepath.write_bytes(data)
        logger.info(f"Image saved: {filepath}")
        return {
            "filename": filename,
            "filepath": str(filepath.relative_to(self.base_dir)),
            "full_path": str(filepath),
        }

    def delete(self, relative_path: str) -> bool:
        filepath = self.base_dir / relative_path
        if filepath.exists() and filepath.is_file():
            filepath.unlink()
            logger.info(f"Image deleted: {filepath}")
            return True
        logger.warning(f"Image not found for deletion: {filepath}")
        return False

    def get_path(self, relative_path: str) -> Optional[Path]:
        filepath = self.base_dir / relative_path
        if filepath.exists() and filepath.is_file():
            return filepath
        return None

    def file_exists(self, relative_path: str) -> bool:
        return (self.base_dir / relative_path).is_file()
