import logging
from datetime import datetime
from typing import Any, Optional

from app.services.ai.registry.model_registry import ModelRegistry
from app.services.ai.orchestrator.metrics import get_pipeline_metrics
from app.services.ai.plate_detection.model_loader import ModelLoader as PlateModelLoader
from app.services.ai.ocr.ocr_loader import OcrLoader
from app.services.ai.face_recognition.face_loader import FaceLoader
from app.services.ai.vehicle_fingerprint.vehicle_loader import VehicleLoader

logger = logging.getLogger(__name__)

MODEL_NAME_MAP = {
    "yolo": "YOLOv8",
    "easyocr": "EasyOCR",
    "insightface": "InsightFace",
    "resnet50": "ResNet50",
}

MODEL_LOADERS = {
    "yolo": lambda: PlateModelLoader().get_metadata() if PlateModelLoader().is_loaded() else None,
    "easyocr": lambda: OcrLoader().get_metadata() if OcrLoader().is_loaded() else None,
    "insightface": lambda: FaceLoader().get_metadata() if FaceLoader().is_loaded() else None,
    "resnet50": lambda: VehicleLoader().get_metadata() if VehicleLoader().is_loaded() else None,
}


class ModelMonitorService:
    def __init__(self) -> None:
        self._registry = ModelRegistry()

    def get_all_model_infos(self) -> list[dict]:
        infos = self._registry.get_all_infos()
        results = []
        for info in infos:
            metrics = self._compute_model_metrics(info.name)
            results.append({
                "name": MODEL_NAME_MAP.get(info.name, info.name),
                "model_type": info.model_type,
                "version": info.version,
                "device": info.device,
                "loaded": info.loaded,
                "model_path": info.model_path,
                "memory_mb": info.memory_mb,
                "error": info.error,
                "total_inference_count": metrics.get("total_calls", 0),
                "avg_inference_time_ms": metrics.get("avg_duration_ms", 0.0),
                "last_inference_timestamp": metrics.get("last_timestamp", None),
                "error_count": metrics.get("error_count", 0),
            })
        return results

    def get_model_detail(self, name: str) -> Optional[dict]:
        model_key = self._resolve_model_key(name)
        info = self._registry.get_info(model_key)
        if info is None:
            loader_info = self._get_loader_metadata(name)
            if loader_info is None:
                return None
            return {
                "name": name,
                "model_type": loader_info.get("model_type", "unknown"),
                "version": loader_info.get("version", "unknown"),
                "device": loader_info.get("device", "cpu"),
                "loaded": loader_info.get("loaded", False),
                "model_path": loader_info.get("model_path"),
                "memory_mb": None,
                "error": None,
                "total_inference_count": 0,
                "avg_inference_time_ms": 0.0,
                "last_inference_timestamp": None,
                "error_count": 0,
            }

        metrics = self._compute_model_metrics(model_key)
        return {
            "name": MODEL_NAME_MAP.get(model_key, model_key),
            "model_type": info.model_type,
            "version": info.version,
            "device": info.device,
            "loaded": info.loaded,
            "model_path": info.model_path,
            "memory_mb": info.memory_mb,
            "error": info.error,
            "total_inference_count": metrics.get("total_calls", 0),
            "avg_inference_time_ms": metrics.get("avg_duration_ms", 0.0),
            "last_inference_timestamp": metrics.get("last_timestamp", None),
            "error_count": metrics.get("error_count", 0),
        }

    def _resolve_model_key(self, name: str) -> str:
        reverse_map = {v: k for k, v in MODEL_NAME_MAP.items()}
        return reverse_map.get(name, name.lower())

    def _get_loader_metadata(self, name: str) -> Optional[dict]:
        key = self._resolve_model_key(name)
        loader_fn = MODEL_LOADERS.get(key)
        if loader_fn:
            return loader_fn()
        return None

    def _compute_model_metrics(self, name: str) -> dict:
        metrics = get_pipeline_metrics()
        snapshot = metrics.snapshot()
        stage_times = {}
        stage_failures = {}
        for stage in snapshot.stages:
            stage_lower = stage.stage_name.lower()
            if name in stage_lower or stage_lower.startswith(name):
                stage_times[stage.stage_name] = stage.avg_duration_ms
                stage_failures[stage.stage_name] = stage.failure_count

        avg_time = 0.0
        total_calls = 0
        error_count = 0
        if stage_times:
            avg_time = sum(stage_times.values()) / len(stage_times)
            for stage_name in stage_failures:
                for s in snapshot.stages:
                    if s.stage_name == stage_name:
                        total_calls += s.total_calls
                        error_count += s.failure_count

        recent = metrics.get_recent_requests(1)
        last_ts = None
        if recent and "timestamp" in recent[0]:
            last_ts = datetime.fromtimestamp(recent[0]["timestamp"])

        return {
            "total_calls": total_calls,
            "avg_duration_ms": round(avg_time, 2),
            "last_timestamp": last_ts.isoformat() if last_ts else None,
            "error_count": error_count,
        }


model_monitor_service = ModelMonitorService()
