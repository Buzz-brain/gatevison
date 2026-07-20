import pytest

from app.services.ai.orchestrator.pipeline_result import PipelineResult
from app.services.decision.evidence_collector import EvidenceCollector
from app.services.decision.evidence import SUPPORTED_MODULES


@pytest.fixture
def collector():
    return EvidenceCollector()


def test_collect_empty_result(collector):
    result = PipelineResult(
        success=False, request_id="test", total_processing_time=0.0,
    )
    evidence = collector.collect(result)
    names = [e.module_name for e in evidence]
    assert "plate_detection" in names
    assert "ocr" in names
    assert "face_recognition" not in names
    assert "vehicle_fingerprint" not in names


def test_collect_full_evidence(collector):
    result = PipelineResult(
        success=True,
        request_id="test",
        total_processing_time=100.0,
        detected_plates=[{"bbox": [0, 0, 100, 50], "confidence": 0.95}],
        recognized_plates=[
            {"plate": "ABC-1234", "confidence": 0.92, "validation_status": "validated"}
        ],
        face_recognitions=[
            {"face_detected": True, "face_count": 1,
             "similarity_score": 0.85, "matched": True}
        ],
        vehicle_detections=[{"detected": True, "embedding_count": 1}],
        vehicle_fingerprints=[{"dimension": 2048, "duration_ms": 50.0}],
    )
    evidence = collector.collect(result)
    names = [e.module_name for e in evidence]
    assert "plate_detection" in names
    assert "ocr" in names
    assert "face_recognition" in names
    assert "vehicle_fingerprint" in names


def test_collect_plate_confidence(collector):
    result = PipelineResult(
        success=True,
        request_id="test",
        total_processing_time=0.0,
        detected_plates=[{"bbox": [0, 0, 100, 50], "confidence": 0.95}],
    )
    evidence = collector.collect(result)
    plate = next(e for e in evidence if e.module_name == "plate_detection")
    assert plate.confidence == 0.95
    assert plate.matched is True


def test_collect_plate_no_detections(collector):
    result = PipelineResult(
        success=True, request_id="test", total_processing_time=0.0,
    )
    evidence = collector.collect(result)
    plate = next(e for e in evidence if e.module_name == "plate_detection")
    assert plate.confidence == 0.0
    assert plate.matched is False


def test_collect_ocr_confidence(collector):
    result = PipelineResult(
        success=True,
        request_id="test",
        total_processing_time=0.0,
        recognized_plates=[
            {"plate": "ABC-1234", "confidence": 0.92, "validation_status": "validated"}
        ],
    )
    evidence = collector.collect(result)
    ocr = next(e for e in evidence if e.module_name == "ocr")
    assert ocr.confidence == 0.92
    assert ocr.matched is True


def test_collect_ocr_no_recognitions(collector):
    result = PipelineResult(
        success=True, request_id="test", total_processing_time=0.0,
    )
    evidence = collector.collect(result)
    ocr = next(e for e in evidence if e.module_name == "ocr")
    assert ocr.confidence == 0.0
    assert ocr.matched is False


def test_collect_face_absent(collector):
    result = PipelineResult(
        success=True, request_id="test", total_processing_time=0.0,
    )
    evidence = collector.collect(result)
    assert not any(e.module_name == "face_recognition" for e in evidence)


def test_collect_vehicle_absent(collector):
    result = PipelineResult(
        success=True, request_id="test", total_processing_time=0.0,
    )
    evidence = collector.collect(result)
    assert not any(e.module_name == "vehicle_fingerprint" for e in evidence)
