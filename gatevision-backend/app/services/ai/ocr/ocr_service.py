import asyncio
import logging
import time
from typing import Optional

import cv2
import numpy as np

from app.config.settings import settings
from app.models.ocr_result import OcrResult
from app.repositories.ocr_repository import OcrRepository
from app.services.ai.camera.frame_processor import FrameProcessor
from app.services.ai.ocr.ocr_loader import OcrLoader, OcrLoadError
from app.services.ai.ocr.ocr_logger import OcrLogger
from app.services.ai.ocr.plate_reader import PlateReader, OcrReadError
from app.services.ai.ocr.plate_validator import (
    PlateValidatorFactory,
    NigeriaPlateValidator,
)
from app.services.ai.ocr.text_cleaner import TextCleaner
from app.schemas.ocr import (
    OcrReadResponse,
    OcrResultResponse,
)

logger = logging.getLogger(__name__)


class OcrService:
    def __init__(
        self,
        plate_reader: Optional[PlateReader] = None,
        repository: Optional[OcrRepository] = None,
    ):
        self.plate_reader = plate_reader or PlateReader()
        self.repository = repository or OcrRepository()
        self.ocr_logger = OcrLogger()
        self.validator = NigeriaPlateValidator()

    async def read_from_image(
        self, image: np.ndarray, plate_detection_id: Optional[str] = None
    ) -> OcrReadResponse:
        self.ocr_logger.ocr_started(
            source=f"image_{plate_detection_id or 'upload'}"
        )

        try:
            results = await asyncio.to_thread(self.plate_reader.read, image)
        except OcrReadError as e:
            self.ocr_logger.ocr_failure(str(e))
            return self._empty_response()

        if not results:
            self.ocr_logger.no_text_detected()
            result = await self._save_result(
                "", "", 0.0, 0.0, plate_detection_id
            )
            return self._to_read_response(result)

        best = PlateReader.pick_best(results) or results[0]
        confidence = best.get("confidence", 0.0)
        processing_time = best.get("inference_time_ms", 0.0)
        raw_text = best.get("text", "")

        cleaned = TextCleaner.clean(raw_text)
        validation = self.validator.validate(cleaned)

        self.ocr_logger.ocr_completed(raw_text, confidence, processing_time)
        self.ocr_logger.validation_result(
            "valid" if validation.valid else "invalid", validation.message
        )

        if not validation.valid:
            self.ocr_logger.invalid_format(raw_text)

        status = "valid" if validation.valid else "invalid"
        result = await self._save_result(
            raw_text, cleaned, confidence, processing_time,
            plate_detection_id, status, validation.message,
        )

        return self._to_read_response(result)

    async def read_many(self, images: list[np.ndarray]) -> list[dict]:
        """OCR a batch of plate crops in a single call and return per-crop results.

        The CPU-bound OCR runs in a worker thread so the event loop stays
        responsive while the reader is working (30-50s on a busy frame).
        """
        per_image = await asyncio.to_thread(self.plate_reader.read_many, images)
        responses: list[dict] = []
        for i, results in enumerate(per_image):
            if not results:
                responses.append({
                    "plate_index": i,
                    "raw_text": "",
                    "cleaned_text": "",
                    "confidence": 0.0,
                    "validation_status": "unreadable",
                    "validation_message": "No text detected in crop",
                })
                continue
            best = PlateReader.pick_best(results) or results[0]
            raw_text = best.get("text", "")
            confidence = best.get("confidence", 0.0)
            processing_time = best.get("inference_time_ms", 0.0)
            cleaned = TextCleaner.clean(raw_text)
            validation = self.validator.validate(cleaned)
            responses.append({
                "plate_index": i,
                "raw_text": raw_text,
                "cleaned_text": cleaned,
                "confidence": confidence,
                "processing_time_ms": round(processing_time, 2),
                "validation_status": "valid" if validation.valid else "invalid",
                "validation_message": validation.message,
            })
        return responses

    async def read_from_bytes(
        self, data: bytes, plate_detection_id: Optional[str] = None
    ) -> OcrReadResponse:
        image = FrameProcessor.read_bytes(data)
        if image is None:
            self.ocr_logger.image_error("failed to decode")
            return self._empty_response()
        return await self.read_from_image(image, plate_detection_id)

    async def read_from_path(
        self, path: str, plate_detection_id: Optional[str] = None
    ) -> OcrReadResponse:
        image = cv2.imread(path)
        if image is None:
            self.ocr_logger.image_error(f"cannot read path: {path}")
            return self._empty_response()
        return await self.read_from_image(image, plate_detection_id)

    async def read_from_detection(
        self, plate_detection_id: str, cropped_path: str
    ) -> OcrReadResponse:
        return await self.read_from_path(
            cropped_path, plate_detection_id
        )

    async def get_result(self, result_id: str) -> Optional[OcrResultResponse]:
        record = await self.repository.get_by_id(result_id)
        if record is None:
            return None
        return self._to_response(record)

    async def get_by_detection(
        self, detection_id: str
    ) -> Optional[OcrResultResponse]:
        record = await self.repository.get_by_detection_id(detection_id)
        if record is None:
            return None
        return self._to_response(record)

    async def get_history(
        self, skip: int = 0, limit: int = 100
    ) -> list[OcrResultResponse]:
        records = await self.repository.get_recent(skip, limit)
        return [self._to_response(r) for r in records]

    async def search(self, query: str, limit: int = 50) -> list[OcrResultResponse]:
        records = await self.repository.search_by_plate(query, limit)
        return [self._to_response(r) for r in records]

    async def get_model_info(self) -> dict:
        loader = OcrLoader()
        return loader.get_metadata()

    def _empty_response(self) -> OcrReadResponse:
        return OcrReadResponse(
            raw_text="",
            cleaned_text="",
            confidence=0.0,
            processing_time=0.0,
            validation_status="error",
            validation_message="No text detected",
        )

    async def _save_result(
        self,
        raw_text: str,
        cleaned_text: str,
        confidence: float,
        processing_time: float,
        plate_detection_id: Optional[str] = None,
        validation_status: str = "unchecked",
        validation_message: str = "",
    ) -> OcrResult:
        try:
            return await self.repository.create_from_ocr(
                raw_text=raw_text,
                cleaned_text=cleaned_text,
                confidence=confidence,
                processing_time=processing_time,
                validation_status=validation_status,
                validation_message=validation_message,
                plate_detection_id=plate_detection_id,
            )
        except Exception as e:
            logger.warning("Failed to persist OCR result (continuing): %s", e)
            # Database is down - return an in-memory result so the caller can
            # still respond. Constructing the beanie Document here would raise
            # CollectionWasNotInitialized, so use a plain namespace instead.
            from types import SimpleNamespace

            return SimpleNamespace(
                raw_text=raw_text,
                cleaned_text=cleaned_text,
                confidence=confidence,
                processing_time=processing_time,
                validation_status=validation_status,
                validation_message=validation_message,
                plate_detection_id=plate_detection_id,
            )

    def _to_read_response(self, record: OcrResult) -> OcrReadResponse:
        return OcrReadResponse(
            raw_text=record.raw_text,
            cleaned_text=record.cleaned_text,
            confidence=record.confidence,
            processing_time=record.processing_time,
            validation_status=record.validation_status,
            validation_message=record.validation_message,
        )

    def _to_response(self, record: OcrResult) -> OcrResultResponse:
        return OcrResultResponse(
            id=str(record.id),
            plate_detection_id=record.plate_detection_id,
            raw_text=record.raw_text,
            cleaned_text=record.cleaned_text,
            confidence=record.confidence,
            processing_time=record.processing_time,
            validation_status=record.validation_status,
            validation_message=record.validation_message,
            created_at=record.created_at,
        )
