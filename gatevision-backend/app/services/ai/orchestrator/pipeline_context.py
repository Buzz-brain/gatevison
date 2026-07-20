import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional

import numpy as np


@dataclass
class PipelineContext:
    request_id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    camera_id: Optional[str] = None
    frame: Optional[np.ndarray] = None
    frame_metadata: dict = field(default_factory=dict)
    detections: list = field(default_factory=list)
    cropped_plates: list = field(default_factory=list)
    ocr_results: list = field(default_factory=list)
    processing_times: dict = field(default_factory=dict)
    errors: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    timestamps: dict = field(default_factory=dict)
    uploaded_image_id: Optional[str] = None
    face_detections: list = field(default_factory=list)
    face_embeddings: list = field(default_factory=list)
    face_recognition_results: list = field(default_factory=list)
    vehicle_embeddings: list = field(default_factory=list)
    vehicle_fingerprint_results: list = field(default_factory=list)
    decision: Optional[dict] = None
    gate_workflow_result: Optional[dict] = None

    def add_timestamp(self, name: str) -> None:
        self.timestamps[name] = datetime.now(timezone.utc).isoformat()

    def add_processing_time(self, stage: str, duration_ms: float) -> None:
        self.processing_times[stage] = duration_ms

    def add_error(self, stage: str, message: str) -> None:
        self.errors.append({"stage": stage, "message": message})

    def add_warning(self, stage: str, message: str) -> None:
        self.warnings.append({"stage": stage, "message": message})
