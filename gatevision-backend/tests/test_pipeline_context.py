from app.services.ai.orchestrator.pipeline_context import PipelineContext


def test_default_request_id():
    ctx = PipelineContext()
    assert len(ctx.request_id) == 12


def test_custom_request_id():
    ctx = PipelineContext(request_id="my-req-1")
    assert ctx.request_id == "my-req-1"


def test_initial_state():
    ctx = PipelineContext()
    assert ctx.detections == []
    assert ctx.ocr_results == []
    assert ctx.errors == []
    assert ctx.warnings == []
    assert ctx.processing_times == {}


def test_add_timestamp():
    ctx = PipelineContext()
    ctx.add_timestamp("start")
    assert "start" in ctx.timestamps


def test_add_processing_time():
    ctx = PipelineContext()
    ctx.add_processing_time("detect", 45.2)
    assert ctx.processing_times["detect"] == 45.2


def test_add_error():
    ctx = PipelineContext()
    ctx.add_error("ocr", "Failed to read")
    assert len(ctx.errors) == 1
    assert ctx.errors[0]["stage"] == "ocr"


def test_add_warning():
    ctx = PipelineContext()
    ctx.add_warning("detect", "Low confidence")
    assert len(ctx.warnings) == 1
    assert ctx.warnings[0]["message"] == "Low confidence"
