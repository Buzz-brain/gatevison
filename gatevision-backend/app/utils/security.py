import hashlib
import logging
import re
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile, status

from app.config.settings import settings

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "image/bmp",
}

MAX_FILE_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024

PATH_TRAVERSAL_PATTERN = re.compile(r"(\.\./|\.\.\\)")


async def validate_upload(
    file: UploadFile,
    allowed_mimes: Optional[set[str]] = None,
    max_size: Optional[int] = None,
) -> bytes:
    allowed = allowed_mimes or ALLOWED_MIME_TYPES
    max_sz = max_size or MAX_FILE_SIZE

    if file.content_type and file.content_type not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{file.content_type}' not allowed. Allowed: {', '.join(sorted(allowed))}",
        )

    if file.filename:
        if PATH_TRAVERSAL_PATTERN.search(file.filename):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid filename: path traversal detected",
            )

    ext = Path(file.filename or "").suffix.lower() if file.filename else ""
    if ext not in {".jpg", ".jpeg", ".png", ".webp", ".bmp"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' not allowed",
        )

    data = await file.read()

    if len(data) > max_sz:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE_MB} MB",
        )

    if len(data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    return data


def compute_file_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sanitize_filename(filename: str) -> str:
    name = Path(filename).name
    name = re.sub(r"[^\w\-_.]", "_", name)
    return name


def check_path_traversal(path: str) -> None:
    if PATH_TRAVERSAL_PATTERN.search(path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path traversal detected in request",
        )


def validate_image_dimensions(width: int, height: int) -> None:
    if width <= 0 or height <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image dimensions",
        )
    if width > 10000 or height > 10000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image dimensions too large (max 10000x10000)",
        )
