from unittest.mock import MagicMock, patch

import numpy as np

from app.services.ai.camera.camera_service import CameraService, CameraError


def _make_mock_cap():
    mock_cap = MagicMock()
    mock_cap.isOpened.return_value = True
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    mock_cap.read.return_value = (True, frame)
    mock_cap.get.side_effect = lambda prop: {
        3: 640,
        4: 480,
        5: 30.0,
    }.get(prop, 0.0)
    return mock_cap


def _make_mock_cap_not_opened():
    mock_cap = MagicMock()
    mock_cap.isOpened.return_value = False
    return mock_cap


@patch("cv2.VideoCapture")
def test_start_camera(mock_vc):
    mock_vc.return_value = _make_mock_cap()
    service = CameraService()
    result = service.start(source=0, camera_id="test_cam")
    assert result["is_running"] is True
    assert result["camera_id"] == "test_cam"
    assert result["status"] == "running"
    assert service.is_running() is True


@patch("cv2.VideoCapture")
def test_start_camera_fails(mock_vc):
    mock_vc.return_value = _make_mock_cap_not_opened()
    service = CameraService()
    try:
        service.start(source=999)
        assert False, "Should have raised CameraError"
    except CameraError as e:
        assert "Failed to open camera" in str(e)


@patch("cv2.VideoCapture")
def test_start_already_running(mock_vc):
    mock_vc.return_value = _make_mock_cap()
    service = CameraService()
    service.start()
    try:
        service.start()
        assert False, "Should have raised CameraError"
    except CameraError as e:
        assert "already running" in str(e)


@patch("cv2.VideoCapture")
def test_stop_camera(mock_vc):
    mock_vc.return_value = _make_mock_cap()
    service = CameraService()
    service.start()
    result = service.stop()
    assert result["status"] == "stopped"
    assert service.is_running() is False


def test_stop_not_running():
    service = CameraService()
    try:
        service.stop()
        assert False, "Should have raised CameraError"
    except CameraError as e:
        assert "No camera is running" in str(e)


@patch("cv2.VideoCapture")
def test_capture_frame(mock_vc):
    mock_vc.return_value = _make_mock_cap()
    service = CameraService()
    service.start()
    frame = service.capture()
    assert frame is not None
    assert frame.shape == (480, 640, 3)


def test_capture_not_running():
    service = CameraService()
    try:
        service.capture()
        assert False, "Should have raised CameraError"
    except CameraError as e:
        assert "Camera is not running" in str(e)


@patch("cv2.VideoCapture")
def test_capture_fails(mock_vc):
    mock_cap = _make_mock_cap()
    mock_cap.read.return_value = (False, None)
    mock_vc.return_value = mock_cap
    service = CameraService()
    service.start()
    try:
        service.capture()
        assert False, "Should have raised CameraError"
    except CameraError as e:
        assert "Failed to capture frame" in str(e)


@patch("cv2.VideoCapture")
def test_status_running(mock_vc):
    mock_vc.return_value = _make_mock_cap()
    service = CameraService()
    service.start()
    status = service.status()
    assert status["is_running"] is True
    assert status["status"] == "running"
    assert "uptime_seconds" in status
    assert "resolution" in status
    assert "fps" in status


def test_status_stopped():
    service = CameraService()
    status = service.status()
    assert status["is_running"] is False
    assert status["status"] == "stopped"


@patch("cv2.VideoCapture")
def test_frame_count(mock_vc):
    mock_vc.return_value = _make_mock_cap()
    service = CameraService()
    service.start()
    service.capture()
    service.capture()
    status = service.status()
    assert status["frame_count"] == 2


@patch("cv2.VideoCapture")
def test_detect_cameras(mock_vc):
    mock_vc.return_value = _make_mock_cap()
    cameras = CameraService.detect_cameras(max_checks=3)
    assert len(cameras) > 0
    assert cameras[0]["source"] == 0


@patch("cv2.VideoCapture")
def test_release(mock_vc):
    mock_vc.return_value = _make_mock_cap()
    service = CameraService()
    service.start()
    service.release()
    assert service.is_running() is False


@patch("cv2.VideoCapture")
def test_validate_frame(mock_vc):
    mock_vc.return_value = _make_mock_cap()
    service = CameraService()
    frame = np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)
    result = service.validate_frame(frame)
    assert "valid" in result
    assert "resolution_valid" in result
    assert "is_blurry" in result


@patch("cv2.VideoCapture")
def test_get_last_frame(mock_vc):
    mock_vc.return_value = _make_mock_cap()
    service = CameraService()
    service.start()
    assert service.get_last_frame() is None
    service.capture()
    assert service.get_last_frame() is not None
