import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ScanLine, Play, RotateCcw, Loader2, ArrowDownToLine, ArrowUpFromLine,
} from "lucide-react";
import { PageContainer, SectionHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useUIStore } from "@/store/ui-store";
import { usePipeline, STAGE_ORDER } from "./hooks/use-pipeline";
import { usePlayback } from "./hooks/use-playback";
import { useProcessPipeline, useProcessPipelineCamera, useStartCamera, useStopCamera, useCreatePendingVehicle } from "./hooks/use-recognition-api";
import { LiveGateOverlay } from "./components/live-gate-overlay";
import { CaptureInput } from "./components/capture-input";
import { PlateBoxesOverlay } from "./components/plate-boxes-overlay";
import { Pipeline } from "./components/pipeline";
import { CroppedResults } from "./components/cropped-results";
import { OCRPanel } from "./components/ocr-panel";
import { FacePanel } from "./components/face-panel";
import { VehiclePanel } from "./components/vehicle-panel";
import { DecisionPanel } from "./components/decision-panel";
import { PlaybackControls } from "./components/playback-controls";
import { ProcessingStatus } from "./components/processing-status";
import { InvestigationTimeline } from "./components/investigation-timeline";
import { buildTimelineFromApi, mapPipelineResult, formatTimestamp } from "./api/mapper";
import { getPipelineStatusApi } from "@/services/api/pipeline.api";
import { getRecognitionResultApi } from "@/services/api/recognition.api";
import type { RecognitionResult } from "./types";
import type { ApiPipelineStatus, ApiPipelineStage, ApiPlateBox } from "./types/api";

function RecognitionCenterPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
const [plateBoxes, setPlateBoxes] = useState<ApiPlateBox[]>([]);
  const [direction, setDirection] = useState<"entry" | "exit">("entry");
  const [requireFace, setRequireFace] = useState(true);
  const [liveGateOpen, setLiveGateOpen] = useState(false);
  const [captureSource, setCaptureSource] = useState<"upload" | "camera" | null>(null);
  const [playbackMode, setPlaybackMode] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<Array<{ time: string; label: string; stage: string; status: string; detail?: string }>>([]);
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const prefersReduced = useReducedMotion();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const addNotification = useUIStore((s) => s.addNotification);

  const { stages, activeStageIndex, isComplete: pipelineComplete, isRunning,
    start: startPipeline, reset: resetPipeline, applyBackendStatus } = usePipeline({ autoStart: false });

  const processMutation = useProcessPipeline();
  const cameraProcessMutation = useProcessPipelineCamera();
  const startCameraMutation = useStartCamera();
  const stopCameraMutation = useStopCamera();
  const createPendingMutation = useCreatePendingVehicle();

  const handleFileSelected = useCallback((file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setResult(null);
    setPlateBoxes([]);
    setPlaybackMode(false);
    resetPipeline();
    setTimelineEvents([]);
    setPipelineId(null);
    setUploadProgress(0);
  }, [previewUrl, resetPipeline]);

  const pollPipelineStatus = useCallback((id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status: ApiPipelineStatus = await getPipelineStatusApi(id);
        applyBackendStatus(status);
        if (status.status === "completed" || status.status === "failed" || status.status === "manual_review") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          if (status.status === "completed") {
            try {
              const fullResult = await getRecognitionResultApi(id);
              const mapped = mapPipelineResult(fullResult);
              setResult(mapped);
              setIsProcessing(false);
              setTimelineEvents(buildTimelineFromApi(fullResult.timestamps, mapped.stages));
            } catch {
              setIsProcessing(false);
            }
          } else {
            setIsProcessing(false);
          }
        }
      } catch {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setIsProcessing(false);
      }
    }, 500);
  }, [applyBackendStatus]);

  const applyResultStatus = useCallback((apiResult: {
    id: string;
    status: "processing" | "completed" | "failed" | "manual_review";
    pipeline_stages: ApiPipelineStage[];
  }) => {
    const lastStage = apiResult.pipeline_stages
      .slice()
      .reverse()
      .find((s) => s.status === "completed" || s.status === "failed" || s.status === "manual_review");
    applyBackendStatus({
      pipeline_id: apiResult.id,
      status: apiResult.status,
      current_stage: lastStage?.stage ?? "decision",
      progress: 100,
      stages: apiResult.pipeline_stages,
    });
  }, [applyBackendStatus]);

  const runRecognition = useCallback(async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setCaptureSource("upload");
    setResult(null);
    setPlaybackMode(false);
    setUploadProgress(0);
    startPipeline();

    try {
      const apiResult = await processMutation.mutateAsync({ file: selectedFile, direction, requireFace });
      applyResultStatus(apiResult);
      setPlateBoxes(apiResult.plates ?? []);

      if (apiResult.status === "completed") {
        const mapped = mapPipelineResult(apiResult);
        setResult(mapped);
        setTimelineEvents(buildTimelineFromApi(apiResult.timestamps, mapped.stages));
        setIsProcessing(false);
        addNotification({
          type: "success",
          category: "recognition",
          title: "Recognition complete",
          description: apiResult.ocr?.raw_text
            ? `Plate read as ${apiResult.ocr.raw_text}.`
            : "Pipeline finished. No plate text was recognized.",
        });
      } else if (apiResult.status === "processing") {
        setPipelineId(apiResult.id);
        pollPipelineStatus(apiResult.id);
      } else {
        const mapped = mapPipelineResult(apiResult);
        setResult(mapped);
        setIsProcessing(false);
        setTimelineEvents(buildTimelineFromApi(apiResult.timestamps, mapped.stages));
        if (apiResult.status === "failed") {
          addNotification({
            type: "warning",
            category: "recognition",
            title: "Recognition completed with errors",
            description: "One or more pipeline stages failed. Check the progress panel for details.",
          });
        }
      }
    } catch (err) {
      setIsProcessing(false);
      applyBackendStatus({
        pipeline_id: "",
        status: "failed",
        current_stage: "decision",
        progress: 100,
        stages: [],
      });
      const message = (err as { message?: string })?.message || "Recognition failed";
      addNotification({
        type: "error",
        category: "recognition",
        title: "Recognition failed",
        description: message,
      });
    }
  }, [selectedFile, direction, processMutation, startPipeline, pollPipelineStatus, applyResultStatus, applyBackendStatus, addNotification]);

  const runLiveCapture = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setCaptureSource("camera");
    setResult(null);
    setPlaybackMode(false);
    startPipeline();

    let started = false;
    try {
      await startCameraMutation.mutateAsync(0);
      started = true;
      const pending = await createPendingMutation.mutateAsync(direction);
      const plate = pending.plate_text;
      addNotification({
        type: "success",
        category: "recognition",
        title: "Vehicle scanned - awaiting face",
        description: plate
          ? `Plate read as ${plate}. Ask the driver to complete identity on the gate phone.`
          : "Vehicle scanned. No plate text recognized - ask the driver to complete identity at the gate.",
      });
    } catch (err) {
      applyBackendStatus({
        pipeline_id: "",
        status: "failed",
        current_stage: "decision",
        progress: 100,
        stages: [],
      });
      const message = (err as { message?: string })?.message || "Live capture failed";
      addNotification({
        type: "error",
        category: "recognition",
        title: "Live capture failed",
        description: message,
      });
    } finally {
      setIsProcessing(false);
      setCaptureSource(null);
      if (started) {
        try {
          await stopCameraMutation.mutateAsync();
        } catch {
          // Best-effort release of the backend camera device
        }
      }
    }
  }, [isProcessing, direction, startCameraMutation, createPendingMutation, stopCameraMutation, startPipeline, applyBackendStatus, addNotification]);

  const playback = usePlayback({
    stages: result?.stages ?? stages,
    onStageChange: (index) => {
      const stageEvents = result?.stages ?? stages;
      const visibleEvents = timelineEvents.slice(0, index + 2);
      setTimelineEvents(visibleEvents);
    },
    onComplete: () => {
      setTimelineEvents(result?.stages?.map((s) => ({
        time: "--:--:--",
        label: s.label,
        stage: s.stage,
        status: s.status,
        detail: s.detail,
      })) ?? timelineEvents);
    },
  });

  const currentStageKey = playback.playback.isPlaying || playbackMode
    ? STAGE_ORDER[playback.playback.currentStageIndex] ?? "decision"
    : (isProcessing ? STAGE_ORDER[activeStageIndex] : undefined);

  const startPlayback = useCallback(() => {
    if (!result) return;
    setPlaybackMode(true);
    resetPipeline();
    setResult(null);
    playback.restart();
    setTimelineEvents([]);
  }, [result, resetPipeline, playback]);

  const exitPlayback = useCallback(() => {
    setPlaybackMode(false);
    playback.setPlaying(false);
    if (result) {
      applyBackendStatus({
        pipeline_id: result.id,
        status: "completed",
        current_stage: "decision",
        progress: 100,
        stages: result.stages.map((s) => ({
          stage: s.stage,
          status: s.status,
          progress: s.progress,
          label: s.label,
          detail: s.detail,
          confidence: s.confidence,
          duration_ms: s.duration ?? 0,
          started_at: "",
          completed_at: "",
        })),
      });
    }
  }, [result, playback, applyBackendStatus]);

  const handleJumpToStage = useCallback((_stage: string) => {
    playback.stepForward();
  }, [playback]);

  const handleJumpToEvent = useCallback((_index: number) => {
    playback.stepForward();
  }, [playback]);

  const decision = result?.decision ?? null;

  const handleChooseDirection = useCallback((dir: "entry" | "exit") => {
    setDirection(dir);
    setLiveGateOpen(true);
  }, []);

  return (
    <PageContainer className="space-y-6 pb-10">
      {/* Bold Entry / Exit chooser — fills the page and sits well */}
      <div className="flex min-h-[calc(100vh-260px)] items-center justify-center rounded-2xl border border-border bg-elevated/60 px-6 py-10 shadow-lg">
        <div className="flex w-full max-w-3xl flex-col items-center gap-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Gate Scan</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose the direction to start the live vehicle scan immediately.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
            <button
              onClick={() => handleChooseDirection("entry")}
              disabled={isProcessing}
              className={cn(
                "group relative flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border bg-surface p-8 text-center transition-all cursor-pointer",
                "hover:border-success/60 hover:bg-success/5",
                direction === "entry" && "border-success bg-success/10",
                isProcessing && "cursor-not-allowed opacity-60",
              )}
            >
              <ArrowDownToLine className="h-14 w-14 text-success transition-transform group-hover:scale-110" />
              <span className="text-3xl font-extrabold tracking-tight text-foreground">ENTRY</span>
              <span className="text-xs text-muted-foreground">Vehicle entering the facility</span>
            </button>
            <button
              onClick={() => handleChooseDirection("exit")}
              disabled={isProcessing}
              className={cn(
                "group relative flex min-h-44 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-border bg-surface p-8 text-center transition-all cursor-pointer",
                "hover:border-info/60 hover:bg-info/5",
                direction === "exit" && "border-info bg-info/10",
                isProcessing && "cursor-not-allowed opacity-60",
              )}
            >
              <ArrowUpFromLine className="h-14 w-14 text-info transition-transform group-hover:scale-110" />
              <span className="text-3xl font-extrabold tracking-tight text-foreground">EXIT</span>
              <span className="text-xs text-muted-foreground">Vehicle leaving the facility</span>
            </button>
          </div>

          <div className="flex items-center justify-center">
            <label
              className="flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-border bg-surface px-8 py-4 shadow-sm transition-colors hover:border-foreground/40"
              title="When enabled, access is denied or sent for review if a clear face is not captured"
            >
              <span className="text-xl font-bold tracking-tight text-foreground">Face required</span>
              <Switch
                checked={requireFace}
                onCheckedChange={setRequireFace}
                className="h-12 w-24 [&>span]:h-10 [&>span]:w-10 [&[aria-checked='true']>span]:translate-x-[52px] [&[aria-checked='false']>span]:translate-x-1"
              />
            </label>
          </div>

          {isProcessing && captureSource === "camera" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning from device...
            </div>
          )}
        </div>
      </div>

      {playbackMode && (
        <motion.div
          initial={prefersReduced ? undefined : { opacity: 0, y: -8 }}
          animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          className="sticky top-2 z-10"
        >
          <PlaybackControls
            playback={playback.playback}
            onTogglePlay={playback.togglePlay}
            onStepForward={playback.stepForward}
            onStepBack={playback.stepBack}
            onRestart={playback.restart}
            onSpeedChange={playback.setSpeed}
          />
          <p className="mt-1 text-center text-[10px] text-muted-foreground/60">
            Interactive AI Playback — synchronized highlighting across overlay, pipeline, timeline & evidence
          </p>
        </motion.div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Recognition Results */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Recognition Results</h3>
            {previewUrl && plateBoxes.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  YOLO plate detection — boxes drawn where the detector located each plate
                </p>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
                  <img src={previewUrl} alt="Captured frame with plate boxes" className="absolute inset-0 h-full w-full object-cover" />
                  <PlateBoxesOverlay imageUrl={previewUrl} plates={plateBoxes} />
                </div>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <CroppedResults
                results={[result.croppedVehicle, result.croppedPlate, result.croppedFace]}
              />
              <OCRPanel ocr={result.ocr} />
              <FacePanel face={result.face} />
              <VehiclePanel vehicle={result.vehicle} />
            </div>
          </div>

          {/* Decision / Session */}
          <div>
            <h3 className="mb-2 text-sm font-medium">Decision</h3>
            <DecisionPanel decision={decision} mode={direction} gate={result.gate} />
          </div>
        </div>
      )}

      {/* Run Analysis — per-run: only after a recognition has completed */}
      {result || playbackMode ? (
        <CollapsibleSection title="Run Analysis" badge="Optional" defaultOpen>
          <div className="space-y-4">
            {result && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-elevated/40 px-4 py-3">
                <p className="text-xs text-muted-foreground">Replay the recognition sequence with synchronized highlighting</p>
                <Button variant="outline" size="sm" onClick={startPlayback} className="gap-1.5">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Replay Analysis
                </Button>
              </div>
            )}

            <InvestigationTimeline
              events={timelineEvents.map((e) => ({
                time: e.time,
                label: e.label,
                stage: e.stage as typeof STAGE_ORDER[number],
                status: e.status as "completed" | "processing" | "failed" | "manual_review" | "inactive",
                detail: e.detail,
              }))}
              activeStage={currentStageKey}
              onJumpToStage={handleJumpToStage}
              onJumpToEvent={handleJumpToEvent}
              currentEventIndex={playbackMode ? playback.playback.currentStageIndex + 1 : undefined}
            />
          </div>
        </CollapsibleSection>
      ) : null}

      {liveGateOpen && (
        <LiveGateOverlay
          onClose={() => setLiveGateOpen(false)}
          direction={direction}
          requireFace={requireFace}
        />
      )}
    </PageContainer>
  );
}

export { RecognitionCenterPage };
