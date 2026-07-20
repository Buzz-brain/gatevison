import platform
import sys
from datetime import datetime
from typing import Optional

from app.config.settings import settings

try:
    import fastapi
    fastapi_version = fastapi.__version__
except ImportError:
    fastapi_version = "unknown"


class VersionService:
    def __init__(self) -> None:
        self._build_timestamp: Optional[str] = None

    def set_build_timestamp(self, timestamp: str) -> None:
        self._build_timestamp = timestamp

    def get_version_info(self) -> dict:
        ai_libs = {}
        for lib_name, import_name in [
            ("ultralytics", "ultralytics"),
            ("easyocr", "easyocr"),
            ("insightface", "insightface"),
            ("torch", "torch"),
            ("torchvision", "torchvision"),
            ("numpy", "numpy"),
            ("opencv", "cv2"),
            ("pillow", "PIL"),
            ("beanie", "beanie"),
            ("motor", "motor"),
            ("pymongo", "pymongo"),
        ]:
            try:
                mod = __import__(import_name)
                ai_libs[lib_name] = getattr(mod, "__version__", "unknown")
            except ImportError:
                ai_libs[lib_name] = "not installed"

        mongo_version = None
        try:
            from pymongo import MongoClient
            from app.config.settings import settings as s
            c = MongoClient(s.MONGODB_URI, serverSelectionTimeoutMS=1000)
            info = c.server_info()
            mongo_version = info.get("version", "unknown")
            c.close()
        except Exception:
            mongo_version = "unknown"

        return {
            "system_name": settings.APP_NAME,
            "version": settings.VERSION,
            "build_timestamp": self._build_timestamp or datetime.utcnow().isoformat(),
            "python_version": sys.version.split()[0],
            "fastapi_version": fastapi_version,
            "mongodb_version": mongo_version,
            "ai_libraries": ai_libs,
        }


version_service = VersionService()
