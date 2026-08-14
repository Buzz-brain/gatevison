import logging
import time
from typing import Optional

import cv2
import numpy as np

from app.config.settings import settings
from app.services.ai.camera.frame_processor import FrameProcessor

logger = logging.getLogger(__name__)


class CameraError(Exception):
    pass


class CameraService:
    def __init__(self):
        self._capture: Optional[cv2.VideoCapture] = None
        self._camera_id: str = "default"
        self._source: int = 0
        self._is_running: bool = False
        self._last_frame: Optional[np.ndarray] = None
        self._last_capture_time: float = 0.0
        self._last_processed_signature: Optional[tuple] = None
        self._started_at: Optional[float] = None
        self._frame_count: int = 0

    def start(self, source: int = 0, camera_id: str = "default") -> dict:
        if self._is_running:
            raise CameraError(f"Camera '{camera_id}' is already running")

        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            raise CameraError(f"Failed to open camera source {source}")

        self._capture = cap
        self._source = source
        self._camera_id = camera_id
        self._is_running = True
        self._started_at = time.time()
        self._frame_count = 0
        self._last_frame = None

        logger.info(f"Camera '{camera_id}' started on source {source}")
        return self.status()

    def stop(self) -> dict:
        if not self._is_running:
            raise CameraError("No camera is running")

        if self._capture:
            self._capture.release()
        self._capture = None
        self._is_running = False
        self._last_frame = None

        logger.info(f"Camera '{self._camera_id}' stopped")
        return {
            "camera_id": self._camera_id,
            "status": "stopped",
        }

    def capture(self) -> np.ndarray:
        if not self._is_running or self._capture is None:
            raise CameraError("Camera is not running")

        now = time.time()
        interval = settings.CAMERA_MIN_CAPTURE_INTERVAL_MS / 1000.0
        if (
            self._last_frame is not None
            and interval > 0
            and (now - self._last_capture_time) < interval
        ):
            # Throttle repeated frames: return the most recent frame without
            # reading the device again (avoids unnecessary device captures).
            self._frame_count += 1
            return self._last_frame.copy()

        ret, frame = self._capture.read()
        if not ret or frame is None:
            raise CameraError("Failed to capture frame - camera may be disconnected")

        self._frame_count += 1
        self._last_capture_time = now
        self._last_frame = frame.copy()
        return frame

    def status(self) -> dict:
        info = {
            "camera_id": self._camera_id,
            "is_running": self._is_running,
            "source": self._source,
            "frame_count": self._frame_count,
        }
        if self._is_running and self._started_at:
            info["uptime_seconds"] = round(time.time() - self._started_at, 1)
        if self._is_running and self._capture:
            w = int(self._capture.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(self._capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = self._capture.get(cv2.CAP_PROP_FPS)
            info["resolution"] = f"{w}x{h}"
            info["fps"] = round(fps, 1) if fps > 0 else "unknown"
        if not self._is_running:
            info["status"] = "stopped"
        else:
            info["status"] = "running"
        return info

    def is_running(self) -> bool:
        return self._is_running

    @staticmethod
    def _signature(frame: np.ndarray) -> Optional[tuple]:
        """Cheap, robust signature of a frame for duplicate detection."""
        if frame is None or frame.size == 0:
            return None
        small = cv2.resize(frame, (32, 32))
        gray = FrameProcessor.to_grayscale(small)
        return (float(np.mean(gray)), (gray // 16).tobytes())

    def is_duplicate_of_processed(self, frame: np.ndarray) -> bool:
        """True when the frame is effectively identical to the last processed one.

        Used by the orchestrator to skip re-processing a static scene (no new
        vehicle activity). Returns False when disabled or nothing processed yet.
        """
        if not settings.CAMERA_AVOID_DUPLICATE_PROCESSING:
            return False
        if self._last_processed_signature is None:
            return False
        sig = self._signature(frame)
        return sig is not None and sig == self._last_processed_signature

    def note_processed(self, frame: np.ndarray) -> None:
        """Record that a frame has been fully processed by the pipeline."""
        self._last_processed_signature = self._signature(frame)

    def get_last_frame(self) -> Optional[np.ndarray]:
        if self._last_frame is not None:
            return self._last_frame.copy()
        return None

    @staticmethod
    def detect_cameras(max_checks: int = 5) -> list[dict]:
        available = []
        for i in range(max_checks):
            cap = cv2.VideoCapture(i)
            if cap.isOpened():
                w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                available.append({"source": i, "resolution": f"{w}x{h}"})
                cap.release()
        return available

    def validate_frame(self, frame: np.ndarray) -> dict:
        if frame is None or frame.size == 0:
            return {"valid": False, "error": "Empty frame"}
        validation = FrameProcessor.validate_resolution(frame)
        blur = FrameProcessor.blur_detection(frame)
        return {
            "valid": validation["valid"] and not blur["is_blurry"],
            "resolution_valid": validation["valid"],
            "is_blurry": blur["is_blurry"],
            "laplacian_variance": blur["laplacian_variance"],
            "width": validation["width"],
            "height": validation["height"],
        }

    def release(self):
        if self._capture:
            self._capture.release()
        self._capture = None
        self._is_running = False
        self._last_frame = None
        logger.info("Camera resources released")
