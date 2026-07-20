import struct
from typing import Optional


class EmbeddingSerializer:
    @staticmethod
    def to_bytes(embedding: list[float]) -> bytes:
        return struct.pack(f"{len(embedding)}d", *embedding)

    @staticmethod
    def from_bytes(data: bytes) -> list[float]:
        count = len(data) // 8
        return list(struct.unpack(f"{count}d", data))

    @staticmethod
    def to_db(embedding: list[float]) -> list[float]:
        return [round(v, 8) for v in embedding]

    @staticmethod
    def from_db(data: Optional[list[float]]) -> Optional[list[float]]:
        return data

    @staticmethod
    def dimension(data: list[float]) -> int:
        return len(data)
