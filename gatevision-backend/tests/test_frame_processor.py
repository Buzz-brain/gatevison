import numpy as np
import cv2
from app.services.ai.camera.frame_processor import FrameProcessor


def _create_test_frame(width=640, height=480):
    return np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)


def _create_blank_frame(width=640, height=480):
    return np.zeros((height, width, 3), dtype=np.uint8)


def test_resize():
    frame = _create_test_frame(800, 600)
    resized = FrameProcessor.resize(frame, 400, 300)
    assert resized.shape == (300, 400, 3)


def test_resize_by_max_no_change():
    frame = _create_test_frame(640, 480)
    result = FrameProcessor.resize_by_max(frame, max_dim=1280)
    assert result.shape == (480, 640, 3)


def test_resize_by_max_downscales():
    frame = _create_test_frame(1920, 1080)
    result = FrameProcessor.resize_by_max(frame, max_dim=640)
    assert max(result.shape) <= 640


def test_bgr_to_rgb():
    frame = _create_test_frame()
    rgb = FrameProcessor.bgr_to_rgb(frame)
    assert rgb.shape == frame.shape
    assert rgb[0, 0, 0] == frame[0, 0, 2]


def test_rgb_to_bgr():
    frame = _create_test_frame()
    bgr = FrameProcessor.rgb_to_bgr(frame)
    assert bgr.shape == frame.shape
    assert bgr[0, 0, 2] == frame[0, 0, 0]


def test_to_grayscale():
    frame = _create_test_frame()
    gray = FrameProcessor.to_grayscale(frame)
    assert len(gray.shape) == 2


def test_to_grayscale_already_gray():
    gray_in = np.random.randint(0, 255, (100, 100), dtype=np.uint8)
    gray_out = FrameProcessor.to_grayscale(gray_in)
    assert gray_out.shape == (100, 100)


def test_adjust_brightness():
    frame = _create_test_frame()
    brightened = FrameProcessor.adjust_brightness(frame, 50)
    assert brightened.shape == frame.shape
    assert brightened.dtype == np.uint8


def test_adjust_contrast():
    frame = _create_test_frame()
    contrasted = FrameProcessor.adjust_contrast(frame, 1.5)
    assert contrasted.shape == frame.shape
    assert contrasted.dtype == np.uint8


def test_blur_detection_sharp():
    frame = np.random.randint(0, 255, (480, 640), dtype=np.uint8)
    result = FrameProcessor.blur_detection(frame, threshold=10.0)
    assert "is_blurry" in result
    assert "laplacian_variance" in result
    assert "threshold" in result
    assert isinstance(result["is_blurry"], (bool, np.bool_))


def test_blur_detection_blurry():
    frame = np.ones((100, 100), dtype=np.uint8) * 128
    result = FrameProcessor.blur_detection(frame, threshold=1000.0)
    assert result["is_blurry"] == True


def test_get_resolution():
    frame = _create_test_frame(800, 600)
    w, h = FrameProcessor.get_resolution(frame)
    assert w == 800
    assert h == 600


def test_validate_resolution_valid():
    frame = _create_test_frame(640, 480)
    result = FrameProcessor.validate_resolution(frame, min_w=320, min_h=240)
    assert result["valid"] is True


def test_validate_resolution_invalid():
    frame = _create_test_frame(100, 100)
    result = FrameProcessor.validate_resolution(frame, min_w=320, min_h=240)
    assert result["valid"] is False


def test_quality_score():
    frame = _create_test_frame(640, 480)
    score = FrameProcessor.quality_score(frame)
    assert "overall" in score
    assert "resolution_score" in score
    assert "sharpness_score" in score
    assert "brightness_score" in score
    assert 0 <= score["overall"] <= 100


def test_to_bytes_and_read_bytes_roundtrip():
    frame = _create_test_frame(100, 100)
    data = FrameProcessor.to_bytes(frame)
    assert isinstance(data, bytes)
    assert len(data) > 0

    decoded = FrameProcessor.read_bytes(data)
    assert decoded is not None
    assert decoded.shape == frame.shape


def test_read_bytes_invalid():
    result = FrameProcessor.read_bytes(b"notanimage")
    assert result is None
