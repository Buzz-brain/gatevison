import { useState, useCallback } from "react";
import type { PipelineStage, StageState, StageStatus } from "../types";
import type { ApiPipelineStatus, ApiPipelineStage } from "../types/api";

const STAGE_ORDER: PipelineStage[] = [
  "vehicle_detection", "plate_detection", "ocr", "face_recognition",
  "vehicle_fingerprint", "identity_verification", "decision",
];

const DEFAULT_STAGES: StageState[] = STAGE_ORDER.map((stage) => ({
  stage,
  status: "inactive" as StageStatus,
  progress: 0,
  label: stageLabels(stage),
}));

function stageLabels(s: string): string {
  const labels: Record<string, string> = {
    vehicle_detection: "Vehicle Detection",
    plate_detection: "Plate Detection",
    ocr: "OCR",
    face_recognition: "Face Recognition",
    vehicle_fingerprint: "Vehicle Fingerprint",
    identity_verification: "Identity Verification",
    decision: "Decision Engine",
  };
  return labels[s] ?? s;
}

interface UsePipelineOptions {
  stages?: StageState[];
  autoStart?: boolean;
  speed?: number;
}

interface UsePipelineReturn {
  stages: StageState[];
  activeStageIndex: number;
  isComplete: boolean;
  isRunning: boolean;
  start: () => void;
  reset: () => void;
  skipTo: (index: number) => void;
  applyBackendStatus: (status: ApiPipelineStatus | null) => void;
  applyBackendStages: (backendStages: ApiPipelineStage[] | null) => void;
}

function usePipeline(opts: UsePipelineOptions = {}): UsePipelineReturn {
  const [stages, setStages] = useState<StageState[]>(DEFAULT_STAGES);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);

  const reset = useCallback(() => {
    setStages(DEFAULT_STAGES);
    setActiveStageIndex(-1);
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    reset();
    setIsRunning(true);
  }, [reset]);

  const skipTo = useCallback((index: number) => {
    setStages((prev) =>
      prev.map((s, i) => ({
        ...s,
        status: i < index ? "completed" as StageStatus :
                i === index ? "processing" as StageStatus :
                "inactive" as StageStatus,
        progress: i < index ? 100 : i === index ? 50 : 0,
      })),
    );
    setActiveStageIndex(index);
    if (index >= STAGE_ORDER.length - 1) {
      setIsRunning(false);
    }
  }, []);

  const applyBackendStatus = useCallback((status: ApiPipelineStatus | null) => {
    if (!status) return;
    const currentStageIdx = STAGE_ORDER.indexOf(status.current_stage as PipelineStage);
    const newStages: StageState[] = STAGE_ORDER.map((stage, i) => {
      const backendStage = status.stages?.find((s) => s.stage === stage);
      const stageStatus: StageStatus = backendStage
        ? (backendStage.status as StageStatus)
        : i < currentStageIdx ? "completed" as StageStatus
        : i === currentStageIdx ? "processing" as StageStatus
        : "inactive" as StageStatus;
      return {
        stage,
        status: stageStatus,
        progress: backendStage?.progress ?? (i < currentStageIdx ? 100 : i === currentStageIdx ? 50 : 0),
        label: stageLabels(stage),
        detail: backendStage?.detail,
        confidence: backendStage?.confidence,
        duration: backendStage?.duration_ms,
      };
    });
    setStages(newStages);
    setActiveStageIndex(currentStageIdx);
    if (status.status === "completed" || status.status === "failed" || status.status === "manual_review") {
      setIsRunning(false);
    }
  }, []);

  const applyBackendStages = useCallback((backendStages: ApiPipelineStage[] | null) => {
    if (!backendStages || backendStages.length === 0) return;
    const newStages: StageState[] = STAGE_ORDER.map((stage) => {
      const backendStage = backendStages.find((s) => s.stage === stage);
      if (!backendStage) {
        return {
          stage,
          status: "inactive" as StageStatus,
          progress: 0,
          label: stageLabels(stage),
        };
      }
      return {
        stage,
        status: backendStage.status as StageStatus,
        progress: backendStage.progress,
        label: backendStage.label,
        detail: backendStage.detail,
        confidence: backendStage.confidence,
        duration: backendStage.duration_ms,
      };
    });
    setStages(newStages);
    const completedIdx = Math.max(
      -1,
      ...newStages
        .map((s, i) => (s.status === "completed" ? i : -1))
        .filter((i) => i >= 0),
    );
    const processingIdx = newStages.findIndex((s) => s.status === "processing");
    setActiveStageIndex(processingIdx >= 0 ? processingIdx : completedIdx);
    const allDone = newStages.every((s) => s.status === "completed" || s.status === "failed" || s.status === "manual_review");
    if (allDone) setIsRunning(false);
  }, []);

  return {
    stages,
    activeStageIndex,
    isComplete: activeStageIndex >= STAGE_ORDER.length - 1,
    isRunning,
    start,
    reset,
    skipTo,
    applyBackendStatus,
    applyBackendStages,
  };
}

export { usePipeline, STAGE_ORDER };
