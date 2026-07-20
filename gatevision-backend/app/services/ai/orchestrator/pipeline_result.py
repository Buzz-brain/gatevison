from dataclasses import dataclass, field, asdict
from typing import Any, Optional


@dataclass
class StageResult:
    stage_name: str
    success: bool
    duration_ms: float
    error: Optional[str] = None
    details: Optional[dict] = None

    def to_dict(self) -> dict:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass
class PipelineResult:
    success: bool
    request_id: str
    total_processing_time: float
    stage_results: list = field(default_factory=list)
    detected_plates: list = field(default_factory=list)
    recognized_plates: list = field(default_factory=list)
    warnings: list = field(default_factory=list)
    errors: list = field(default_factory=list)
    face_detections: list = field(default_factory=list)
    face_recognitions: list = field(default_factory=list)
    vehicle_detections: list = field(default_factory=list)
    vehicle_fingerprints: list = field(default_factory=list)
    decision: Optional[dict] = None
    gate_workflow_result: Optional[dict] = None

    def to_dict(self) -> dict:
        d = {
            "success": self.success,
            "request_id": self.request_id,
            "total_processing_time": round(self.total_processing_time, 2),
            "plates_detected": len(self.detected_plates),
            "plates_recognized": len(self.recognized_plates),
            "recognized_plates": self.recognized_plates,
            "faces_detected": len(self.face_detections),
            "face_recognitions": self.face_recognitions,
            "vehicles_detected": len(self.vehicle_detections),
            "vehicle_fingerprints": self.vehicle_fingerprints,
            "decision": self.decision,
            "stage_results": [s.to_dict() for s in self.stage_results],
            "warnings": self.warnings,
            "errors": self.errors,
        }
        if self.gate_workflow_result:
            d["gate_workflow_result"] = self.gate_workflow_result
        return d
