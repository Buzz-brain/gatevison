import os
import tempfile
from pathlib import Path
from app.services.ai.camera.storage_service import ImageStorageService, CATEGORY_DIRS


def test_storage_service_creates_dirs():
    with tempfile.TemporaryDirectory() as tmp:
        base = Path(tmp)
        service = ImageStorageService()
        service.base_dir = base
        service._ensure_directories()
        for subdir in CATEGORY_DIRS.values():
            assert (base / subdir).is_dir()


def test_generate_filename():
    service = ImageStorageService()
    name1 = service.generate_filename("entry")
    name2 = service.generate_filename("entry", extension="png")
    assert name1.endswith(".jpg")
    assert name2.endswith(".png")
    assert len(name1) == 36
    assert len(name2) == 36
    assert name1 != name2


def test_get_category_dir():
    service = ImageStorageService()
    d = service.get_category_dir("entry")
    assert d.name == "entry"
    d2 = service.get_category_dir("unknown")
    assert d2.name == "temp"


def test_save_and_delete():
    with tempfile.TemporaryDirectory() as tmp:
        service = ImageStorageService()
        service.base_dir = Path(tmp)
        service._ensure_directories()
        data = b"fakeimagedata"
        result = service.save(data, "entry")
        assert result["filename"].endswith(".jpg")
        assert "entry" in result["filepath"]
        saved_path = Path(tmp) / result["filepath"]
        assert saved_path.is_file()
        assert saved_path.read_bytes() == data


def test_save_custom_filename():
    with tempfile.TemporaryDirectory() as tmp:
        service = ImageStorageService()
        service.base_dir = Path(tmp)
        service._ensure_directories()
        result = service.save(b"data", "temp", filename="custom.jpg")
        assert result["filename"] == "custom.jpg"
        saved_path = Path(tmp) / result["filepath"]
        assert saved_path.is_file()


def test_delete_existing():
    with tempfile.TemporaryDirectory() as tmp:
        service = ImageStorageService()
        service.base_dir = Path(tmp)
        service._ensure_directories()
        result = service.save(b"data", "temp")
        assert service.delete(result["filepath"]) is True


def test_delete_nonexistent():
    service = ImageStorageService()
    assert service.delete("nonexistent/path.jpg") is False


def test_file_exists():
    with tempfile.TemporaryDirectory() as tmp:
        service = ImageStorageService()
        service.base_dir = Path(tmp)
        service._ensure_directories()
        result = service.save(b"data", "temp")
        assert service.file_exists(result["filepath"]) is True
        assert service.file_exists("nonexistent.jpg") is False


def test_get_path():
    with tempfile.TemporaryDirectory() as tmp:
        service = ImageStorageService()
        service.base_dir = Path(tmp)
        service._ensure_directories()
        result = service.save(b"data", "temp")
        path = service.get_path(result["filepath"])
        assert path is not None
        assert path.is_file()


def test_get_path_nonexistent():
    service = ImageStorageService()
    assert service.get_path("nonexistent.jpg") is None


def test_save_never_overwrites():
    with tempfile.TemporaryDirectory() as tmp:
        service = ImageStorageService()
        service.base_dir = Path(tmp)
        service._ensure_directories()
        result1 = service.save(b"data1", "temp", filename="unique.jpg")
        result2 = service.save(b"data2", "temp", filename="unique.jpg")
        assert result1["filepath"] != result2["filepath"]
