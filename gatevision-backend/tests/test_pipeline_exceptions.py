from app.services.ai.orchestrator.exceptions import (
    ContextValidationError,
    PipelineExecutionError,
    PipelineTimeoutError,
    StageExecutionError,
)


def test_stage_execution_error():
    exc = StageExecutionError("ocr", "Failed to read plate")
    assert exc.stage_name == "ocr"
    assert "Failed to read plate" in str(exc)


def test_pipeline_execution_error():
    exc = PipelineExecutionError("Something went wrong")
    assert "Something went wrong" in str(exc)


def test_context_validation_error():
    exc = ContextValidationError("No frame provided")
    assert "No frame provided" in str(exc)


def test_pipeline_timeout_error():
    exc = PipelineTimeoutError("Pipeline timed out")
    assert "timed out" in str(exc)


def test_exception_inheritance():
    assert issubclass(StageExecutionError, PipelineExecutionError)
    assert issubclass(ContextValidationError, PipelineExecutionError)
    assert issubclass(PipelineTimeoutError, PipelineExecutionError)
