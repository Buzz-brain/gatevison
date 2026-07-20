from typing import Any

from app.config.settings import settings


VALIDATION_RULES: dict[str, dict] = {
    "PLATE_DETECTION_CONFIDENCE": {"min": 0.0, "max": 1.0, "warning": "Should be between 0.0 and 1.0"},
    "OCR_MIN_CONFIDENCE": {"min": 0.0, "max": 1.0, "warning": "Should be between 0.0 and 1.0"},
    "FACE_SIMILARITY_THRESHOLD": {"min": 0.0, "max": 1.0, "warning": "Should be between 0.0 and 1.0"},
    "VEHICLE_SIMILARITY_THRESHOLD": {"min": 0.0, "max": 1.0, "warning": "Should be between 0.0 and 1.0"},
    "WEIGHT_PLATE": {"min": 0.0, "max": 1.0, "warning": "Should be between 0.0 and 1.0"},
    "WEIGHT_OCR": {"min": 0.0, "max": 1.0, "warning": "Should be between 0.0 and 1.0"},
    "WEIGHT_FACE": {"min": 0.0, "max": 1.0, "warning": "Should be between 0.0 and 1.0"},
    "WEIGHT_VEHICLE": {"min": 0.0, "max": 1.0, "warning": "Should be between 0.0 and 1.0"},
    "MAX_FILE_SIZE_MB": {"min": 1, "max": 100, "warning": "Should be between 1 and 100 MB"},
    "RATE_LIMIT_REQUESTS": {"min": 1, "max": 10000, "warning": "Should be between 1 and 10000"},
}


class ConfigurationService:
    def get_configuration(self) -> dict:
        return {
            "similarity_thresholds": {
                "face": settings.FACE_SIMILARITY_THRESHOLD,
                "vehicle": settings.VEHICLE_SIMILARITY_THRESHOLD,
            },
            "decision_weights": {
                "plate": settings.WEIGHT_PLATE,
                "ocr": settings.WEIGHT_OCR,
                "face": settings.WEIGHT_FACE,
                "vehicle": settings.WEIGHT_VEHICLE,
            },
            "ocr_thresholds": {
                "min_confidence": settings.OCR_MIN_CONFIDENCE,
                "languages": settings.OCR_LANGUAGES,
            },
            "vehicle_thresholds": {
                "similarity": settings.VEHICLE_SIMILARITY_THRESHOLD,
                "model_name": settings.VEHICLE_MODEL_NAME,
            },
            "face_thresholds": {
                "similarity": settings.FACE_SIMILARITY_THRESHOLD,
                "model_name": settings.FACE_MODEL_NAME,
            },
            "plate_detection": {
                "confidence": settings.PLATE_DETECTION_CONFIDENCE,
                "model_path": settings.YOLO_MODEL_PATH,
            },
            "allowed_file_types": ["image/jpeg", "image/png", "image/jpg"],
            "max_upload_size_mb": settings.MAX_FILE_SIZE_MB,
            "camera": {
                "device": settings.DEVICE,
            },
            "rate_limiting": {
                "enabled": settings.RATE_LIMIT_ENABLED,
                "requests_per_window": settings.RATE_LIMIT_REQUESTS,
                "window_seconds": settings.RATE_LIMIT_WINDOW_SECONDS,
            },
            "environment": settings.ENVIRONMENT,
            "debug": settings.DEBUG,
        }

    def validate_configuration(self) -> list[str]:
        warnings: list[str] = []
        config_dict = {
            "PLATE_DETECTION_CONFIDENCE": settings.PLATE_DETECTION_CONFIDENCE,
            "OCR_MIN_CONFIDENCE": settings.OCR_MIN_CONFIDENCE,
            "FACE_SIMILARITY_THRESHOLD": settings.FACE_SIMILARITY_THRESHOLD,
            "VEHICLE_SIMILARITY_THRESHOLD": settings.VEHICLE_SIMILARITY_THRESHOLD,
            "WEIGHT_PLATE": settings.WEIGHT_PLATE,
            "WEIGHT_OCR": settings.WEIGHT_OCR,
            "WEIGHT_FACE": settings.WEIGHT_FACE,
            "WEIGHT_VEHICLE": settings.WEIGHT_VEHICLE,
            "MAX_FILE_SIZE_MB": settings.MAX_FILE_SIZE_MB,
            "RATE_LIMIT_REQUESTS": settings.RATE_LIMIT_REQUESTS,
        }

        for key, value in config_dict.items():
            rules = VALIDATION_RULES.get(key)
            if rules is None:
                continue
            if "min" in rules and value < rules["min"]:
                warnings.append(f"{key}={value} {rules['warning']} (below minimum {rules['min']})")
            elif "max" in rules and value > rules["max"]:
                warnings.append(f"{key}={value} {rules['warning']} (above maximum {rules['max']})")

        total_weight = settings.WEIGHT_PLATE + settings.WEIGHT_OCR + settings.WEIGHT_FACE + settings.WEIGHT_VEHICLE
        if total_weight < 0.99 or total_weight > 1.01:
            warnings.append(f"Decision weights sum to {total_weight:.2f}, expected ~1.0")

        return warnings


configuration_service = ConfigurationService()
