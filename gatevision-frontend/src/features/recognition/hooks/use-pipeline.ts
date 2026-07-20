import { useState, useEffect, useCallback, useRef } from "react";
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
  const {
    autoStart = false,
    speed = 1,
  } = opts;

  const [stages, setStages] = useState<StageState[]>(DEFAULT_STAGES);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(autoStart);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setStages(DEFAULT_STAGES);
    setActiveStageIndex(-1);
    setIsRunning(false);
  }, [clearTimers]);

  const start = useCallback(() => {
    reset();
    setIsRunning(true);
  }, [reset]);

  const skipTo = useCallback((index: number) => {
    clearTimers();
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
  }, [clearTimers]);

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

  useEffect(() => {
    if (!isRunning) return;
    const delays = STAGE_ORDER.map((_, i) => (i + 1) * (600 / speed));

    STAGE_ORDER.forEach((_stage, i) => {
      const timer = setTimeout(() => {
        setStages((prev) =>
          prev.map((s, j) => ({
            ...s,
            status: j < i ? "completed" as StageStatus :
                    j === i ? "processing" as StageStatus :
                    "inactive" as StageStatus,
            progress: j < i ? 100 : j === i ? 50 : 0,
          })),
        );
        setActiveStageIndex(i);

        setTimeout(() => {
          setStages((prev) =>
            prev.map((s, j) => {
              if (j !== i) return s;
              return { ...s, status: "completed" as StageStatus, progress: 100 };
            }),
          );
        }, (delays[0] || 600) / 2);
      }, delays[i] || (600 / speed));
      timers.current.push(timer);
    });

    const lastTimer = setTimeout(() => {
      setIsRunning(false);
    }, (STAGE_ORDER.length + 1) * (600 / speed));

    timers.current.push(lastTimer);

    return clearTimers;
  }, [isRunning, speed, clearTimers]);

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
