import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  ScanLine, Play, RotateCcw, Loader2, X, MonitorPlay,
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
import { useProcessPipeline, useRecognitionHistory, useDeleteHistoryEntry, useClearHistory } from "./hooks/use-recognition-api";
import { LiveGateOverlay } from "./components/live-gate-overlay";
import { CaptureInput } from "./components/capture-input";
import { Pipeline } from "./components/pipeline";
import { CroppedResults } from "./components/cropped-results";
import { OCRPanel } from "./components/ocr-panel";
import { FacePanel } from "./components/face-panel";
import { VehiclePanel } from "./components/vehicle-panel";
import { DecisionPanel } from "./components/decision-panel";
import { HistoryTable } from "./components/history-table";
import { PlaybackControls } from "./components/playback-controls";
import { ProcessingStatus } from "./components/processing-status";
import { InvestigationTimeline } from "./components/investigation-timeline";
import { buildTimelineFromApi, mapPipelineResult, formatTimestamp } from "./api/mapper";
import { getPipelineStatusApi } from "@/services/api/pipeline.api";
import { getRecognitionResultApi } from "@/services/api/recognition.api";
import type { RecognitionResult, RecognitionHistoryEntry } from "./types";
import type { ApiPipelineStatus, ApiPipelineStage } from "./types/api";

function RecognitionCenterPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [direction, setDirection] = useState<"entry" | "exit">("entry");
  const [requireFace, setRequireFace] = useState(false);
  const [liveGateOpen, setLiveGateOpen] = useState(false);
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
  const { data: historyData } = useRecognitionHistory(1);
  const deleteHistoryMutation = useDeleteHistoryEntry();
  const clearHistoryMutation = useClearHistory();

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
    setResult(null);
    setPlaybackMode(false);
    setUploadProgress(0);
    startPipeline();

    try {
      const apiResult = await processMutation.mutateAsync({ file: selectedFile, direction, requireFace });
      applyResultStatus(apiResult);

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

  const onHistoryReplay = useCallback((entry: RecognitionHistoryEntry) => {
    const loadFromHistory = async () => {
      try {
        const apiResult = await getRecognitionResultApi(entry.pipelineId);
        const mapped = mapPipelineResult(apiResult);
        setResult(mapped);
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setTimelineEvents(buildTimelineFromApi(apiResult.timestamps, mapped.stages));
        applyBackendStatus({
          pipeline_id: apiResult.id,
          status: "completed",
          current_stage: "decision",
          progress: 100,
          stages: apiResult.pipeline_stages ?? [],
        });
      } catch {
        // If loading from history fails, silently ignore
      }
    };
    loadFromHistory();
  }, [previewUrl, applyBackendStatus]);

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

  return (
    <PageContainer className="space-y-6 pb-10">
      <SectionHeader
        title="Recognition Center"
        description="Process one vehicle — upload an image to run recognition, then create or verify a gate session"
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setLiveGateOpen(true)} className="gap-1.5">
              <MonitorPlay className="h-3.5 w-3.5" />
              Live Gate
            </Button>
            {playbackMode && (
              <Button variant="ghost" size="sm" onClick={exitPlayback} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Exit Playback
              </Button>
            )}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-0.5">
              <button
                onClick={() => setDirection("entry")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  direction === "entry" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Entry
              </button>
              <button
                onClick={() => setDirection("exit")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  direction === "exit" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Exit
              </button>
            </div>
            <label
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5"
              title="When enabled, access is denied or sent for review if a clear face is not captured"
            >
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Face required</span>
              <Switch checked={requireFace} onCheckedChange={setRequireFace} />
            </label>
            <Button
              size="sm"
              onClick={runRecognition}
              disabled={!selectedFile || isProcessing || processMutation.isPending}
              className="gap-1.5"
            >
              {isProcessing || processMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {direction === "exit" ? "Matching Active Session..." : "Creating Entry Session..."}
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  {direction === "exit" ? "Run Exit Verification" : "Run Recognition"}
                </>
              )}
            </Button>
          </div>
        }
      />

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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,400px)_1fr] lg:items-start">
        {/* Left column: input + process */}
        <div className="space-y-4">
          {/* 1. Input */}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Input</h3>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Step 1</span>
            </div>
            <CaptureInput
              imageUrl={previewUrl ?? result?.frameUrl}
              overlay={result?.boundingBoxes ?? null}
              activeStage={currentStageKey}
              metadata={{
                fileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : "N/A",
                ...(result ? { captureTime: formatTimestamp(result.timestamp) } : {}),
              }}
              disabled={isProcessing}
              readOnly={playbackMode}
              onFileSelected={handleFileSelected}
            />
          </Card>

          {/* 2. Recognition Progress */}
          <div>
            <h3 className="mb-2 text-sm font-medium">
              Recognition Progress
              <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">Step 2</span>
            </h3>
            <div className="space-y-2">
              <ProcessingStatus
                isProcessing={isProcessing}
                activeStageKey={currentStageKey}
                activeLabel={STAGE_ORDER[activeStageIndex]}
              />
              <Pipeline
                stages={result?.stages ?? stages}
                activeStageIndex={playbackMode ? playback.playback.currentStageIndex : activeStageIndex}
              />
            </div>
          </div>
        </div>

        {/* Right column: results + decision */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* 3. Recognition Results */}
              <div>
                <h3 className="mb-2 text-sm font-medium">
                  Recognition Results
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">Step 3</span>
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <CroppedResults
                    results={[result.croppedVehicle, result.croppedPlate, result.croppedFace]}
                  />
                  <OCRPanel ocr={result.ocr} />
                  <FacePanel face={result.face} />
                  <VehiclePanel vehicle={result.vehicle} />
                </div>
              </div>

              {/* 4. Decision / Session */}
              <div>
                <h3 className="mb-2 text-sm font-medium">
                  Decision
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground/60">Step 4</span>
                </h3>
                <DecisionPanel decision={decision} mode={direction} gate={result.gate} />
              </div>
            </>
          ) : (
            <div className="flex min-h-[340px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 p-8 text-center">
              <ScanLine className="h-9 w-9 text-muted-foreground/40" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">No recognition results yet</p>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground/60">
                Upload a vehicle image and run recognition. Live results, decision and evidence will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

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

      {/* Recognition History — always visible */}
      <HistoryTable
        entries={historyData?.entries ?? []}
        onReplay={onHistoryReplay}
        onDelete={(entry) => {
          deleteHistoryMutation.mutate(entry.id, {
            onSuccess: () => {
              addNotification({
                type: "success",
                category: "recognition",
                title: "Entry deleted",
                description: `${entry.plate} removed from recognition history.`,
              });
            },
            onError: (err) => {
              const message = (err as { message?: string })?.message || "Could not delete the history entry.";
              addNotification({
                type: "error",
                category: "recognition",
                title: "Delete failed",
                description: message,
              });
            },
          });
        }}
        onClear={() => {
          clearHistoryMutation.mutate(undefined, {
            onSuccess: (result) => {
              addNotification({
                type: "success",
                category: "recognition",
                title: "History cleared",
                description: `Removed ${result.deleted_records ?? 0} history record(s) from the database.`,
              });
            },
            onError: (err) => {
              const message = (err as { message?: string })?.message || "Could not clear history.";
              addNotification({
                type: "error",
                category: "recognition",
                title: "Clear failed",
                description: message,
              });
            },
          });
        }}
        isDeleting={deleteHistoryMutation.isPending}
        isClearing={clearHistoryMutation.isPending}
      />

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
