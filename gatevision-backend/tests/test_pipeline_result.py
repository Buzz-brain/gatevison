from app.services.ai.orchestrator.pipeline_result import PipelineResult, StageResult


def test_stage_result_defaults():
    sr = StageResult(stage_name="detect", success=True, duration_ms=10.5)
    assert sr.stage_name == "detect"
    assert sr.success is True
    assert sr.error is None


def test_stage_result_to_dict():
    sr = StageResult(
        stage_name="ocr", success=False, duration_ms=5.0, error="timeout",
    )
    d = sr.to_dict()
    assert d["stage_name"] == "ocr"
    assert d["error"] == "timeout"


def test_stage_result_omits_none():
    sr = StageResult(stage_name="test", success=True, duration_ms=1.0)
    d = sr.to_dict()
    assert "error" not in d
    assert "details" not in d


def test_pipeline_result_defaults():
    pr = PipelineResult(success=True, request_id="r1", total_processing_time=100.0)
    assert pr.stage_results == []
    assert pr.detected_plates == []
    assert pr.recognized_plates == []


def test_pipeline_result_with_stages():
    stages = [
        StageResult("a", True, 10.0),
        StageResult("b", False, 5.0, error="fail"),
    ]
    pr = PipelineResult(
        success=True,
        request_id="r2",
        total_processing_time=15.0,
        stage_results=stages,
        detected_plates=[{"bbox": [1, 2, 3, 4]}],
        recognized_plates=[{"plate": "ABC123", "confidence": 0.95}],
    )
    assert len(pr.stage_results) == 2
    assert len(pr.detected_plates) == 1
    assert pr.recognized_plates[0]["plate"] == "ABC123"


def test_pipeline_result_to_dict():
    stages = [StageResult("detect", True, 45.0)]
    pr = PipelineResult(
        success=True,
        request_id="r3",
        total_processing_time=100.0,
        stage_results=stages,
        recognized_plates=[{"plate": "XYZ789", "confidence": 0.88}],
    )
    d = pr.to_dict()
    assert d["success"] is True
    assert d["request_id"] == "r3"
    assert d["plates_recognized"] == 1
    assert d["recognized_plates"][0]["plate"] == "XYZ789"
    assert d["total_processing_time"] == 100.0
