class PipelineExecutionError(Exception):
    pass


class StageExecutionError(PipelineExecutionError):
    def __init__(self, stage_name: str, message: str):
        self.stage_name = stage_name
        self.message = message
        super().__init__(f"[{stage_name}] {message}")


class ContextValidationError(PipelineExecutionError):
    pass


class PipelineTimeoutError(PipelineExecutionError):
    pass
