from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ModelInfo:
    name: str
    model_type: str
    version: str = "unknown"
    device: str = "cpu"
    loaded: bool = False
    model_path: Optional[str] = None
    memory_mb: Optional[float] = None
    error: Optional[str] = None
    metadata: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "model_type": self.model_type,
            "version": self.version,
            "device": self.device,
            "loaded": self.loaded,
            "model_path": self.model_path,
            "memory_mb": self.memory_mb,
            "error": self.error,
            "metadata": self.metadata,
        }
