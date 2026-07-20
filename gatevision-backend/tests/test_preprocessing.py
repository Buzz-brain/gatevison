import numpy as np
from app.services.ai.camera.preprocessing import Preprocessing


def _create_test_frame(width=640, height=480):
    return np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)


def test_normalize():
    frame = _create_test_frame()
    normalized = Preprocessing.normalize(frame)
    assert normalized.dtype == np.float32
    assert normalized.min() >= 0.0
    assert normalized.max() <= 1.0


def test_denormalize():
    normalized = np.random.rand(100, 100, 3).astype(np.float32)
    frame = Preprocessing.denormalize(normalized)
    assert frame.dtype == np.uint8
    assert frame.min() >= 0
    assert frame.max() <= 255


def test_normalize_denormalize_roundtrip():
    original = _create_test_frame(100, 100)
    normalized = Preprocessing.normalize(original)
    denormalized = Preprocessing.denormalize(normalized)
    assert np.allclose(original.astype(np.float32), denormalized.astype(np.float32), atol=1)


def test_crop():
    frame = _create_test_frame(640, 480)
    cropped = Preprocessing.crop(frame, 10, 10, 100, 100)
    assert cropped is not None
    assert cropped.shape == (100, 100, 3)


def test_crop_invalid_region():
    frame = _create_test_frame(100, 100)
    cropped = Preprocessing.crop(frame, 200, 200, 10, 10)
    assert cropped is None


def test_crop_clamps_boundaries():
    frame = _create_test_frame(100, 100)
    cropped = Preprocessing.crop(frame, 50, 50, 200, 200)
    assert cropped is not None
    assert cropped.shape[0] <= 100
    assert cropped.shape[1] <= 100


def test_rotate():
    frame = _create_test_frame(100, 100)
    rotated = Preprocessing.rotate(frame, 45.0)
    assert rotated.shape == frame.shape


def test_rotate_180():
    frame = _create_test_frame(100, 100)
    rotated = Preprocessing.rotate(frame, 180.0)
    assert rotated.shape == frame.shape


def test_pad():
    frame = _create_test_frame(100, 100)
    padded = Preprocessing.pad(frame, top=10, bottom=20, left=5, right=15)
    assert padded.shape == (130, 120, 3)
    assert np.all(padded[:10, :, :] == 0)
    assert np.all(padded[:, :5, :] == 0)


def test_pad_with_color():
    frame = _create_test_frame(50, 50)
    color = (255, 255, 255)
    padded = Preprocessing.pad(frame, top=10, left=10, color=color)
    assert np.all(padded[:10, :, :] == 255)


def test_preserve_aspect_ratio():
    frame = _create_test_frame(200, 100)
    result = Preprocessing.preserve_aspect_ratio(frame, 400, 400)
    assert result.shape == (400, 400, 3)


def test_preserve_aspect_ratio_content():
    frame = np.ones((100, 200, 3), dtype=np.uint8) * 128
    result = Preprocessing.preserve_aspect_ratio(frame, 200, 200)
    assert result.shape == (200, 200, 3)
    h, w = frame.shape[:2]
    scale = min(200 / w, 200 / h)
    expected_content_w = int(w * scale)
    expected_content_h = int(h * scale)
    assert result[0, 0, 0] == 0


def test_flip_horizontal():
    frame = _create_test_frame(100, 100)
    flipped = Preprocessing.flip(frame, horizontal=True)
    assert flipped.shape == frame.shape
    assert np.array_equal(flipped[0, 0], frame[0, -1])


def test_flip_vertical():
    frame = _create_test_frame(100, 100)
    flipped = Preprocessing.flip(frame, horizontal=False)
    assert flipped.shape == frame.shape
    assert np.array_equal(flipped[0, 0], frame[-1, 0])
