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

    # Dedicated license-plate detection model (single class: "license_plate").
    # The generic COCO yolov8n.pt is NOT a plate detector - it reports cars,
    # persons and buses as "plates" and must not be used here.
    YOLO_MODEL_PATH: str = "models/license_plate_detector.pt"
    PLATE_DETECTION_CONFIDENCE: float = 0.25
    DEVICE: str = "cpu"

    # Plate detection geometry filters
    #   A real license plate is wide (roughly 2:1 to 6:1) and small relative to
    #   the frame. Near-square or giant boxes are almost always false positives
    #   (bus-side banners, school logos, signs) and should never be OCR'd.
    PLATE_MIN_ASPECT_RATIO: float = 1.5
    PLATE_MAX_ASPECT_RATIO: float = 8.0

    # Pre-load AI models (YOLO + EasyOCR) at startup so the first request is fast.
    MODEL_WARMUP_ENABLED: bool = True

    OCR_LANGUAGES: str = "en"
    OCR_GPU: str = "auto"
    OCR_MIN_CONFIDENCE: float = 0.45
    OCR_MAX_IMAGE_DIM: int = 480

    # OCR performance tuning
    #   Only the top-N highest-confidence plate crops are OCR'd per frame.
    OCR_MAX_CROPS: int = 4
    #   Skip crops whose YOLO detection confidence is below this threshold.
    #   Low-confidence crops are usually false positives and waste OCR time.
    OCR_MIN_CROP_CONFIDENCE: float = 0.20
    #   Skip crops covering more than this fraction of the frame. A real plate
    #   is always small; giant boxes are false positives that waste OCR time.
    OCR_MAX_CROP_AREA_FRACTION: float = 0.30
    #   Skip crops that are too blurry to read (Laplacian variance < threshold).
    OCR_SKIP_BLURRY_CROPS: bool = True
    OCR_BLUR_LAPLACIAN_THRESHOLD: float = 60.0
    #   Fast decoding. "greedy" is much faster than the default beam search.
    OCR_FAST_DECODER: str = "greedy"
    OCR_BEAM_WIDTH: int = 5
    #   Restricting the character set narrows the beam search -> faster + more accurate.
    OCR_ALLOWLIST: str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ."

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

    # Feature flags (product edition)
    #   Enterprise Identity is the next-generation identity-based Mode B. It is
    #   currently hidden from the live user experience: routes are not registered,
    #   the frontend menu item is hidden, and the page is marked "Future".
    ENABLE_ENTERPRISE_IDENTITY: bool = False
    ENABLE_ENROLLMENT: bool = False
    ENABLE_MANUAL_REVIEW: bool = True
    ENABLE_ADVANCED_ANALYTICS: bool = True
    ENABLE_RECOGNITION_LAB: bool = True

    # Decision Engine mode
    #   "session"  -> Mode A (Session Verification, default): gate decisions are
    #                 based on captured signal quality (plate + face + vehicle),
    #                 no registered identity required.
    #   "identity" -> Mode B (Identity Verification, optional): gate decisions
    #                 resolve against registered driver/vehicle profiles.
    DECISION_MODE: str = "session"

    # Session Verification (Mode A) capture requirements
    SESSION_REQUIRE_FACE: bool = False
    SESSION_REQUIRE_VEHICLE: bool = False
    SESSION_FACE_CAPTURE_MIN_CONFIDENCE: float = 0.5
    SESSION_VEHICLE_CAPTURE_MIN_CONFIDENCE: float = 0.5

    # Active Session Matcher (Mode A exit) parameters
    SESSION_MATCH_PLATE_WEIGHT: float = 0.5
    SESSION_MATCH_VEHICLE_WEIGHT: float = 0.3
    SESSION_MATCH_FACE_WEIGHT: float = 0.2
    SESSION_MATCH_THRESHOLD: float = 0.55
    SESSION_MATCH_EMBEDDING_FALLBACK_THRESHOLD: float = 0.85

    # Camera performance & reliability
    #   Minimum time between physical camera reads. Repeated captures inside the
    #   window return the most recent frame without touching the device.
    CAMERA_MIN_CAPTURE_INTERVAL_MS: int = 1000
    #   Skip pipeline processing when the captured frame is byte-identical to the
    #   last processed frame (static scene / no new vehicle).
    CAMERA_AVOID_DUPLICATE_PROCESSING: bool = True

    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent


settings = Settings()
