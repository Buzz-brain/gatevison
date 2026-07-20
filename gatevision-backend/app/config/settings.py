from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "GateVision API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "gatevision"

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    LOG_DIR: str = "logs"
    LOG_LEVEL: str = "INFO"

    CORS_ORIGINS: list[str] = ["*"]

    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    YOLO_MODEL_PATH: str = "models/yolov8n.pt"
    PLATE_DETECTION_CONFIDENCE: float = 0.25
    DEVICE: str = "cpu"

    OCR_LANGUAGES: str = "en"
    OCR_GPU: str = "auto"
    OCR_MIN_CONFIDENCE: float = 0.45

    FACE_SIMILARITY_THRESHOLD: float = 0.65
    FACE_MODEL_NAME: str = "buffalo_l"
    FACE_DEVICE: str = "auto"

    VEHICLE_SIMILARITY_THRESHOLD: float = 0.75
    VEHICLE_MODEL_NAME: str = "resnet50"
    VEHICLE_DEVICE: str = "auto"

    WEIGHT_PLATE: float = 0.20
    WEIGHT_OCR: float = 0.30
    WEIGHT_FACE: float = 0.25
    WEIGHT_VEHICLE: float = 0.25

    DEFAULT_DRIVER_STATUS: str = "active"
    DEFAULT_VEHICLE_STATUS: str = "active"
    ALLOW_MULTIPLE_DRIVERS_PER_VEHICLE: bool = True

    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent


settings = Settings()
