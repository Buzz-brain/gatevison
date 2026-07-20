import logging

from app.services.ai.orchestrator.execution_logger import PipelineLogger


def test_pipeline_logger_started(caplog):
    caplog.set_level(logging.INFO)
    pl = PipelineLogger()
    pl.pipeline_started("req-1", ["capture", "detect"])
    assert any("Pipeline started" in r.message for r in caplog.records)
    assert any(r.request_id == "req-1" for r in caplog.records)


def test_stage_started(caplog):
    caplog.set_level(logging.INFO)
    pl = PipelineLogger()
    pl.stage_started("req-1", "detect")
    assert any("Stage started: detect" in r.message for r in caplog.records)


def test_stage_completed(caplog):
    caplog.set_level(logging.INFO)
    pl = PipelineLogger()
    pl.stage_completed("req-1", "ocr", 45.2)
    assert any("Stage completed: ocr" in r.message for r in caplog.records)


def test_stage_failed(caplog):
    caplog.set_level(logging.ERROR)
    pl = PipelineLogger()
    pl.stage_failed("req-1", "detect", "crashed", fatal=False)
    assert any("crashed" in r.message for r in caplog.records)


def test_pipeline_completed(caplog):
    caplog.set_level(logging.INFO)
    pl = PipelineLogger()
    pl.pipeline_completed("req-1", True, 150.0)
    assert any("succeeded" in r.message for r in caplog.records)
