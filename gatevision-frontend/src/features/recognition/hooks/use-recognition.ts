import { useState, useCallback } from "react";
import type { RecognitionResult } from "../types";
import type { ApiPipelineResult } from "../types/api";
import { usePipeline } from "./use-pipeline";
import { mapPipelineResult } from "../api/mapper";

function useRecognition() {
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pipeline = usePipeline({
    autoStart: false,
  });

  const loadResult = useCallback((apiResult: ApiPipelineResult) => {
    const mapped = mapPipelineResult(apiResult);
    setResult(mapped);
    setDuration(apiResult.total_processing_time_ms);
    pipeline.applyBackendStages(apiResult.pipeline_stages);
  }, [pipeline]);

  const startRecognition = useCallback(() => {
    setStartTime(Date.now());
    setError(null);
    setUploadProgress(0);
    pipeline.start();
  }, [pipeline]);

  const clearRecognition = useCallback(() => {
    setResult(null);
    setDuration(0);
    setStartTime(null);
    setUploadProgress(0);
    setError(null);
    pipeline.reset();
  }, [pipeline]);

  return {
    result,
    duration,
    uploadProgress,
    error,
    isProcessing: pipeline.isRunning,
    pipelineStages: pipeline.stages,
    activeStageIndex: pipeline.activeStageIndex,
    isComplete: pipeline.isComplete,
    startRecognition,
    clearRecognition,
    loadResult,
    setUploadProgress,
    setError,
    applyBackendStatus: pipeline.applyBackendStatus,
  };
}

export { useRecognition };
