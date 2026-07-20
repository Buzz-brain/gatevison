import { useState, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  ScanLine, Play, RotateCcw, Loader2, Cpu, X, History,
} from "lucide-react";
import { SectionHeader } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { usePipeline, STAGE_ORDER } from "./hooks/use-pipeline";
import { usePlayback } from "./hooks/use-playback";
import { useRecognition } from "./hooks/use-recognition";
import { useProcessPipeline, useRecognitionHistory } from "./hooks/use-recognition-api";
import { UploadZone } from "./components/upload-zone";
import { InputPreview } from "./components/input-preview";
import { Pipeline } from "./components/pipeline";
import { CroppedResults } from "./components/cropped-results";
import { OCRPanel } from "./components/ocr-panel";
import { FacePanel } from "./components/face-panel";
import { VehiclePanel } from "./components/vehicle-panel";
import { DecisionPanel } from "./components/decision-panel";
import { ExplainableAI } from "./components/explainable-ai";
import { EvidencePanel } from "./components/evidence-panel";
import { Timeline } from "./components/timeline";
import { ModelStatus } from "./components/model-status";
import { ScenarioLoader } from "./components/scenario-loader";
import { HistoryTable } from "./components/history-table";
import { ComparisonSlider } from "./components/comparison-slider";
import { PlaybackControls } from "./components/playback-controls";
import { InvestigationTimeline } from "./components/investigation-timeline";
import { buildTimelineFromApi } from "./api/mapper";
import type { RecognitionResult, RecognitionHistoryEntry } from "./types";
import type { ApiPipelineStatus } from "./types/api";

function RecognitionCenterPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [playbackMode, setPlaybackMode] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<Array<{ time: string; label: string; stage: string; status: string; detail?: string }>>([]);
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const prefersReduced = useReducedMotion();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { stages, activeStageIndex, isComplete: pipelineComplete, isRunning,
    start: startPipeline, reset: resetPipeline, applyBackendStatus } = usePipeline({ autoStart: false });

  const processMutation = useProcessPipeline();
  const { data: historyData } = useRecognitionHistory(1);

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
        const { getPipelineStatusApi } = await import("@/services/api/pipeline.api");
        const status: ApiPipelineStatus = await getPipelineStatusApi(id);
        applyBackendStatus(status);
        if (status.status === "completed" || status.status === "failed" || status.status === "manual_review") {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
          if (status.status === "completed") {
            try {
              const { getRecognitionResultApi } = await import("@/services/api/recognition.api");
              const fullResult = await getRecognitionResultApi(id);
              const { mapPipelineResult } = await import("./api/mapper");
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

  const runRecognition = useCallback(async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setResult(null);
    setPlaybackMode(false);
    setUploadProgress(0);
    startPipeline();

    try {
      const apiResult = await processMutation.mutateAsync(selectedFile);

      if (apiResult.status === "completed") {
        const { mapPipelineResult } = await import("./api/mapper");
        const mapped = mapPipelineResult(apiResult);
        setResult(mapped);
        setTimelineEvents(buildTimelineFromApi(apiResult.timestamps, mapped.stages));
        setIsProcessing(false);
      } else if (apiResult.status === "processing") {
        setPipelineId(apiResult.id);
        pollPipelineStatus(apiResult.id);
      } else {
        const { mapPipelineResult } = await import("./api/mapper");
        const mapped = mapPipelineResult(apiResult);
        setResult(mapped);
        setIsProcessing(false);
        setTimelineEvents(buildTimelineFromApi(apiResult.timestamps, mapped.stages));
      }
    } catch {
      setIsProcessing(false);
    }
  }, [selectedFile, processMutation, startPipeline, pollPipelineStatus]);

  const onHistoryReplay = useCallback((entry: RecognitionHistoryEntry) => {
    const loadFromHistory = async () => {
      try {
        const { getRecognitionResultApi } = await import("@/services/api/recognition.api");
        const apiResult = await getRecognitionResultApi(entry.scenarioId);
        const { mapPipelineResult } = await import("./api/mapper");
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

  const cleanPreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setResult(null);
    resetPipeline();
    setTimelineEvents([]);
    setPipelineId(null);
    setUploadProgress(0);
    setPlaybackMode(false);
  }, [previewUrl, resetPipeline]);

  const decision = result?.decision ?? null;

  return (
    <div className="space-y-6 pb-10">
      <SectionHeader
        title="Recognition Center"
        description="AI Recognition Laboratory — observe every stage of the recognition pipeline in real time"
        action={
          <div className="flex items-center gap-2">
            {selectedFile && !playbackMode && (
              <Button variant="ghost" size="sm" onClick={cleanPreview} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
            {result && !playbackMode && (
              <Button variant="outline" size="sm" onClick={startPlayback} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Replay Analysis
              </Button>
            )}
            {playbackMode && (
              <Button variant="ghost" size="sm" onClick={exitPlayback} className="gap-1.5">
                <X className="h-3.5 w-3.5" />
                Exit Playback
              </Button>
            )}
            <Button
              size="sm"
              onClick={runRecognition}
              disabled={!selectedFile || isProcessing || processMutation.isPending}
              className="gap-1.5"
            >
              {isProcessing || processMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Run Recognition
                </>
              )}
            </Button>
          </div>
        }
      />

      {playbackMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium">Input Source</h3>
            </div>
            <UploadZone
              onFileSelected={handleFileSelected}
              disabled={isProcessing}
            />
          </Card>

          {(previewUrl || result) && (
            <InputPreview
              overlay={result?.boundingBoxes ?? null}
              activeStage={currentStageKey}
              imageUrl={previewUrl ?? result?.frameUrl}
              metadata={{
                resolution: "1920x1080",
                fileSize: selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB` : "N/A",
                captureTime: new Date().toLocaleTimeString(),
              }}
            />
          )}

          <ScenarioLoader />
        </div>

        <div className="space-y-4">
          <Pipeline
            stages={result?.stages ?? stages}
            activeStageIndex={playbackMode ? playback.playback.currentStageIndex : activeStageIndex}
          />
          <ModelStatus />
        </div>
      </div>

      {result && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <CroppedResults
            results={[result.croppedVehicle, result.croppedPlate, result.croppedFace]}
          />
          <OCRPanel ocr={result.ocr} />
          <FacePanel face={result.face} />
          <VehiclePanel vehicle={result.vehicle} />
        </div>
      )}

      {result && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DecisionPanel decision={decision} />
          </div>
          <ExplainableAI data={result.explainableAI} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          {timelineEvents.length > 0 ? (
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
          ) : (
            <Timeline
              events={timelineEvents.length > 0 ? timelineEvents as any : []}
              activeStage={currentStageKey}
            />
          )}
        </div>
        <div className="lg:col-span-2 space-y-4">
          {result && (
            <>
              <Card className="p-4">
                <h3 className="mb-3 text-sm font-medium">Face Comparison</h3>
                <ComparisonSlider referenceLabel="Reference" liveLabel="Live Capture" />
              </Card>
              <Card className="p-4">
                <h3 className="mb-3 text-sm font-medium">Vehicle Comparison</h3>
                <ComparisonSlider referenceLabel="Reference" liveLabel="Live Capture" />
              </Card>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {result && <EvidencePanel evidence={result.evidence} />}
        <HistoryTable
          entries={historyData?.entries ?? []}
          onReplay={onHistoryReplay}
        />
      </div>

      {!selectedFile && !result && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ScanLine className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-medium">Ready to Analyze</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground/70">
            Upload a vehicle image to begin the AI recognition pipeline.
          </p>
        </Card>
      )}
    </div>
  );
}

export { RecognitionCenterPage };
