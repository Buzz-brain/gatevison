from unittest.mock import patch, MagicMock

from app.models.image import ImageCategory


def test_image_category_enum():
    assert ImageCategory.ENTRY.value == "entry"
    assert ImageCategory.EXIT.value == "exit"
    assert ImageCategory.FACE.value == "face"
    assert ImageCategory.VEHICLE.value == "vehicle"
    assert ImageCategory.PLATE.value == "plate"
    assert ImageCategory.TEMP.value == "temp"


def test_image_model_settings():
    assert ImageCategory.ENTRY.value == "entry"


def test_image_category_count():
    assert len([c for c in ImageCategory]) == 6


@patch("app.models.image.Image.get_settings")
def test_image_model_defaults(mock_settings):
    mock_settings.return_value = MagicMock()
    from app.models.image import Image
    image = Image(
        filename="test.jpg",
        filepath="uploads/temp/test.jpg",
        category=ImageCategory.TEMP,
        mime_type="image/jpeg",
        width=640,
        height=480,
        filesize=1024,
        camera_id="default",
    )
    assert image.filename == "test.jpg"
    assert image.mime_type == "image/jpeg"
    assert image.width == 640
    assert image.height == 480
    assert image.filesize == 1024
    assert image.camera_id == "default"


@patch("app.models.image.Image.get_settings")
def test_image_model_timestamps(mock_settings):
    mock_settings.return_value = MagicMock()
    from app.models.image import Image
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    image = Image(
        filename="test.jpg",
        filepath="uploads/temp/test.jpg",
        category=ImageCategory.ENTRY,
        width=1920,
        height=1080,
        filesize=50000,
        captured_at=now,
    )
    assert image.captured_at == now
    assert image.created_at is not None


@patch("app.models.image.Image.get_settings")
def test_image_repr(mock_settings):
    mock_settings.return_value = MagicMock()
    from app.models.image import Image
    image = Image(
        filename="test.jpg",
        filepath="uploads/temp/test.jpg",
        category=ImageCategory.TEMP,
        width=100,
        height=100,
        filesize=100,
    )
    assert "test.jpg" in repr(image)


def test_image_schemas():
    from app.schemas.image import ImageCreate, ImageResponse, CaptureResponse
    from datetime import datetime, timezone

    create = ImageCreate(
        filename="test.jpg",
        filepath="uploads/test.jpg",
        category=ImageCategory.ENTRY,
        width=640,
        height=480,
        filesize=1000,
    )
    assert create.filename == "test.jpg"
    assert create.mime_type == "image/jpeg"

    resp = ImageResponse(
        id="abc123",
        filename="test.jpg",
        filepath="uploads/test.jpg",
        category=ImageCategory.ENTRY,
        mime_type="image/jpeg",
        width=640,
        height=480,
        filesize=1000,
        camera_id="default",
        captured_at=datetime.now(timezone.utc),
        created_at=datetime.now(timezone.utc),
    )
    assert resp.id == "abc123"
    assert resp.category == ImageCategory.ENTRY

    cap = CaptureResponse(
        image_id="abc123",
        filename="test.jpg",
        filepath="uploads/test.jpg",
        width=640,
        height=480,
        filesize=1000,
        category="entry",
        captured_at=datetime.now(timezone.utc),
    )
    assert cap.image_id == "abc123"
    assert cap.filename == "test.jpg"
