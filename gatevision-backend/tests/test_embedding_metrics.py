from app.services.ai.embedding.metrics import EmbeddingMetrics, get_embedding_metrics


def test_initial_snapshot():
    m = EmbeddingMetrics()
    snap = m.snapshot()
    assert snap.total_extractions == 0
    assert snap.total_duration_ms == 0.0
    assert snap.avg_duration_ms == 0.0


def test_record_extraction():
    m = EmbeddingMetrics()
    m.record_extraction(100.0, 512)
    snap = m.snapshot()
    assert snap.total_extractions == 1
    assert snap.total_duration_ms == 100.0
    assert snap.avg_duration_ms == 100.0


def test_multiple_records():
    m = EmbeddingMetrics()
    m.record_extraction(10.0, 512)
    m.record_extraction(30.0, 512)
    snap = m.snapshot()
    assert snap.total_extractions == 2
    assert snap.total_duration_ms == 40.0
    assert snap.avg_duration_ms == 20.0


def test_recent():
    m = EmbeddingMetrics(max_history=10)
    for i in range(5):
        m.record_extraction(float(i * 10), 512)
    recent = m.get_recent(3)
    assert len(recent) == 3
    assert recent[-1]["duration_ms"] == 40.0


def test_get_recent_empty():
    m = EmbeddingMetrics()
    assert m.get_recent() == []


def test_get_embedding_metrics_singleton():
    a = get_embedding_metrics()
    b = get_embedding_metrics()
    assert a is b
