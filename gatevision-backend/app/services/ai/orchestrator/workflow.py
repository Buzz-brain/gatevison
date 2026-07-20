import time
from typing import Any, Callable

from app.services.ai.orchestrator.exceptions import StageExecutionError
from app.services.ai.orchestrator.pipeline_context import PipelineContext
from app.services.ai.orchestrator.pipeline_result import StageResult

StageFn = Callable[[PipelineContext], Any]


class WorkflowEngine:
    def __init__(self, stages: list[StageFn]):
        self._stages = stages

    async def execute(self, context: PipelineContext) -> list[StageResult]:
        results: list[StageResult] = []
        for stage_fn in self._stages:
            stage_name = getattr(stage_fn, "__name__", "unknown")
            context.add_timestamp(f"{stage_name}_start")

            start = time.perf_counter()
            try:
                await stage_fn(context)
                elapsed = (time.perf_counter() - start) * 1000
                results.append(StageResult(
                    stage_name=stage_name, success=True, duration_ms=elapsed,
                ))
                context.add_processing_time(stage_name, elapsed)
                context.add_timestamp(f"{stage_name}_end")
            except StageExecutionError as e:
                elapsed = (time.perf_counter() - start) * 1000
                results.append(StageResult(
                    stage_name=stage_name, success=False,
                    duration_ms=elapsed, error=str(e),
                ))
                context.add_processing_time(stage_name, elapsed)
                context.add_error(stage_name, str(e))
                context.add_timestamp(f"{stage_name}_end")
                return results
            except Exception as e:
                elapsed = (time.perf_counter() - start) * 1000
                results.append(StageResult(
                    stage_name=stage_name, success=False,
                    duration_ms=elapsed, error=str(e),
                ))
                context.add_processing_time(stage_name, elapsed)
                context.add_warning(stage_name, str(e))
                context.add_timestamp(f"{stage_name}_end")

        return results
