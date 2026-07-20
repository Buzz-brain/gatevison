import pytest

from app.services.ai.orchestrator.exceptions import StageExecutionError
from app.services.ai.orchestrator.pipeline_context import PipelineContext
from app.services.ai.orchestrator.workflow import WorkflowEngine


@pytest.mark.asyncio
async def test_all_stages_succeed():
    calls = []

    async def stage_a(ctx):
        calls.append("a")

    async def stage_b(ctx):
        calls.append("b")

    engine = WorkflowEngine([stage_a, stage_b])
    ctx = PipelineContext()
    results = await engine.execute(ctx)

    assert calls == ["a", "b"]
    assert len(results) == 2
    assert all(r.success for r in results)


@pytest.mark.asyncio
async def test_stage_fatal_failure_stops():
    calls = []

    async def stage_a(ctx):
        calls.append("a")

    async def stage_b(ctx):
        calls.append("b")
        raise StageExecutionError("b", "fatal")

    async def stage_c(ctx):
        calls.append("c")

    engine = WorkflowEngine([stage_a, stage_b, stage_c])
    ctx = PipelineContext()

    results = await engine.execute(ctx)

    assert calls == ["a", "b"]
    assert len(results) == 2
    assert results[1].success is False
    assert "fatal" in results[1].error


@pytest.mark.asyncio
async def test_stage_non_fatal_continues():
    calls = []

    async def stage_a(ctx):
        calls.append("a")

    async def stage_b(ctx):
        calls.append("b")
        raise ValueError("non-fatal")

    async def stage_c(ctx):
        calls.append("c")

    engine = WorkflowEngine([stage_a, stage_b, stage_c])
    ctx = PipelineContext()
    results = await engine.execute(ctx)

    assert calls == ["a", "b", "c"]
    assert results[0].success is True
    assert results[1].success is False
    assert results[2].success is True


@pytest.mark.asyncio
async def test_records_processing_times():
    async def stage_a(ctx):
        ctx.detections = ["plate1"]

    engine = WorkflowEngine([stage_a])
    ctx = PipelineContext()
    results = await engine.execute(ctx)

    assert len(results) == 1
    assert results[0].duration_ms > 0
    assert ctx.processing_times["stage_a"] > 0


@pytest.mark.asyncio
async def test_empty_stages():
    engine = WorkflowEngine([])
    ctx = PipelineContext()
    results = await engine.execute(ctx)
    assert results == []
