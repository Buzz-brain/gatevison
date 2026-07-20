from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


SUPPORTED_MODULES = {
    "plate_detection",
    "ocr",
    "face_recognition",
    "vehicle_fingerprint",
}


@dataclass
class Evidence:
    module_name: str
    confidence: float
    matched: bool
    score: Optional[float] = None
    metadata: dict = field(default_factory=dict)
    processing_time: float = 0.0
    timestamp: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def __post_init__(self):
        if self.module_name not in SUPPORTED_MODULES:
            raise ValueError(
                f"Unsupported module '{self.module_name}'. "
                f"Supported: {SUPPORTED_MODULES}"
            )

    def to_dict(self) -> dict:
        return {
            "module_name": self.module_name,
            "confidence": self.confidence,
            "matched": self.matched,
            "score": self.score,
            "metadata": self.metadata,
            "processing_time": self.processing_time,
            "timestamp": self.timestamp,
        }
