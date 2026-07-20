from app.services.ai.orchestrator.metrics import PipelineMetrics


def test_initial_state():
    m = PipelineMetrics()
    snap = m.snapshot()
    assert snap.total_pipelines == 0
    assert snap.stages == []


def test_record_stage():
    m = PipelineMetrics()
    m.record_stage("detect", True, 45.0)
    m.record_stage("detect", True, 55.0)

    snap = m.snapshot()
    assert len(snap.stages) == 1
    s = snap.stages[0]
    assert s.stage_name == "detect"
    assert s.total_calls == 2
    assert s.success_count == 2
    assert s.failure_count == 0
    assert s.avg_duration_ms == 50.0


def test_record_stage_failure():
    m = PipelineMetrics()
    m.record_stage("ocr", True, 30.0)
    m.record_stage("ocr", False, 10.0)

    snap = m.snapshot()
    s = snap.stages[0]
    assert s.success_count == 1
    assert s.failure_count == 1


def test_record_pipeline():
    m = PipelineMetrics()
    m.record_pipeline("req-1", True, 100.0, 3)
    m.record_pipeline("req-2", False, 200.0, 2)

    snap = m.snapshot()
    assert snap.total_pipelines == 2
    assert snap.success_count == 1
    assert snap.failure_count == 1
    assert snap.avg_total_duration_ms == 150.0


def test_recent_requests():
    m = PipelineMetrics(max_history=3)
    m.record_pipeline("r1", True, 10.0, 1)
    m.record_pipeline("r2", False, 20.0, 1)
    m.record_pipeline("r3", True, 30.0, 1)
    m.record_pipeline("r4", True, 40.0, 1)

    recent = m.get_recent_requests(10)
    assert len(recent) == 3
    assert recent[0]["request_id"] == "r2"
    assert recent[-1]["request_id"] == "r4"


def test_multiple_stages():
    m = PipelineMetrics()
    m.record_stage("capture", True, 5.0)
    m.record_stage("detect", True, 50.0)
    m.record_stage("ocr", False, 20.0)

    snap = m.snapshot()
    stage_names = [s.stage_name for s in snap.stages]
    assert stage_names == ["capture", "detect", "ocr"]


def test_get_pipeline_metrics_singleton():
    from app.services.ai.orchestrator.metrics import get_pipeline_metrics
    m1 = get_pipeline_metrics()
    m2 = get_pipeline_metrics()
    assert m1 is m2
