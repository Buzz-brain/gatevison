import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw,
  Camera, Scan, Eye, Fingerprint, Shield, UserCheck, Check, X, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDecisionHistory } from "../hooks/use-dashboard-api";
import { mapDecisionHistoryToRecent } from "../api/mapper";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const stageIcons: Record<string, typeof Scan> = {
  detection: Scan,
  plate: Camera,
  ocr: Eye,
  face: UserCheck,
  fingerprint: Fingerprint,
  identity: Shield,
  decision: Check,
  gate: Camera,
};

const DEFAULT_STAGES = [
  { stage: "detection", label: "Vehicle Detected" },
  { stage: "plate", label: "Plate Detection", detail: "99.1%" },
  { stage: "ocr", label: "OCR Completed", detail: "ABC-123X" },
  { stage: "face", label: "Face Recognition", detail: "97.8%" },
  { stage: "fingerprint", label: "Vehicle Fingerprint", detail: "95.6%" },
  { stage: "identity", label: "Identity Verification" },
  { stage: "decision", label: "Decision", detail: "ACCESS GRANTED" },
  { stage: "gate", label: "Gate Control", detail: "Gate opened" },
];

function buildReplayFromDecision(d: ReturnType<typeof mapDecisionHistoryToRecent>) {
  const totalMs = d.processingTime > 0 ? d.processingTime : 1800;
  const baseTime = new Date(d.timestamp).getTime();
  const stages = DEFAULT_STAGES.map((s, i) => {
    const isDecision = s.stage === "decision";
    const isGate = s.stage === "gate";
    const stageDecision = isDecision
      ? (d.decision === "granted" ? "ACCESS GRANTED" : d.decision === "denied" ? "ACCESS DENIED" : "MANUAL REVIEW")
      : s.detail;
    const stageStatus = isDecision
      ? (d.decision === "granted" ? "completed" : d.decision === "denied" ? "failed" : "active")
      : isGate && d.decision !== "granted" ? "pending" : "completed";
    return {
      stage: s.stage,
      status: stageStatus as "pending" | "active" | "completed" | "failed",
      label: s.label,
      detail: stageDecision,
      timestamp: new Date(baseTime + (i / DEFAULT_STAGES.length) * totalMs).toISOString(),
    };
  });
  return {
    id: d.id,
    plate: d.plate,
    driver: d.driver,
    vehicle: d.vehicle,
    decision: d.decision,
    stages,
    startedAt: d.timestamp,
    completedAt: new Date(baseTime + totalMs).toISOString(),
    totalTime: totalMs,
    confidence: d.confidence,
  };
}

function MissionReplay() {
  const { data: decisions, isLoading, isError, refetch } = useDecisionHistory();
  const [replay, setReplay] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const prefersReduced = useReducedMotion();

  const pickReplay = useCallback(() => {
    const items = decisions?.items ?? [];
    if (items.length === 0) return null;
    const pick = items[Math.floor(Math.random() * items.length)];
    if (!pick) return null;
    const mapped = mapDecisionHistoryToRecent(pick);
    return buildReplayFromDecision(mapped);
  }, [decisions]);

  const startNewReplay = useCallback(() => {
    const r = pickReplay();
    if (r) {
      setReplay(r);
      setCurrentStep(0);
      setIsPlaying(true);
      setIsComplete(false);
    }
  }, [pickReplay]);

  useEffect(() => {
    if (decisions?.items && decisions.items.length > 0 && !replay) {
      startNewReplay();
    }
  }, [decisions, replay, startNewReplay]);

  const totalSteps = replay?.stages?.length ?? 0;

  const reset = useCallback(() => {
    startNewReplay();
  }, [startNewReplay]);

  const togglePlay = useCallback(() => {
    if (isComplete) { reset(); return; }
    setIsPlaying((p) => !p);
  }, [isComplete, reset]);

  const stepForward = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
    }
  }, [currentStep, totalSteps]);

  const stepBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setIsComplete(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isPlaying || isComplete || !replay) return;
    if (prefersReduced) {
      setIsComplete(true);
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(stepForward, 600);
    return () => clearTimeout(timer);
  }, [isPlaying, isComplete, currentStep, stepForward, prefersReduced, replay]);

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="h-4 w-24 bg-muted rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Mission Replay</h3>
        </div>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-xs text-muted-foreground">Failed to load decision data</p>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </Card>
    );
  }

  if (!replay) {
    return (
      <Card className="p-5">
        <h3 className="text-sm font-medium">Mission Replay</h3>
        <p className="mt-2 text-xs text-muted-foreground/50">Waiting for decision data...</p>
      </Card>
    );
  }

  const decisionColors: Record<string, string> = {
    granted: "text-success",
    denied: "text-danger",
    manual_review: "text-warning",
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Mission Replay</h3>
          <p className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">
            {replay.plate} &middot; {replay.totalTime}ms
          </p>
        </div>
        <Badge
          variant={replay.decision === "granted" ? "success" : replay.decision === "denied" ? "danger" : "warning"}
          size="sm"
        >
          {replay.decision === "granted" ? "Granted" : replay.decision === "denied" ? "Denied" : "Review"}
        </Badge>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {replay.stages.slice(0, 4).map((_: any, i: number) => (
          <div
            key={i}
            className={cn(
              "shrink-0 h-14 w-20 rounded-md bg-elevated border border-border flex items-center justify-center transition-all",
              i <= currentStep ? "opacity-100" : "opacity-30",
            )}
          >
            <Camera className="h-4 w-4 text-muted-foreground/40" />
          </div>
        ))}
      </div>

      <div className="space-y-1 mb-4">
        {replay.stages.map((stage: any, i: number) => {
          const isActive = i === currentStep;
          const isPast = i < currentStep;
          const isFuture = i > currentStep;
          const Icon = stageIcons[stage.stage] || Scan;

          return (
            <motion.div
              key={stage.stage}
              initial={prefersReduced ? undefined : { opacity: 0, x: -8 }}
              animate={{ opacity: isFuture ? 0.3 : 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "flex items-center gap-3 rounded-md px-2.5 py-1.5 transition-colors",
                isActive && "bg-elevated border border-border",
              )}
            >
              <div className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full",
                isPast ? "bg-primary/10" : isActive ? "bg-primary/15" : "bg-surface",
              )}>
                {stage.status === "completed" || isPast ? (
                  <Check className="h-2.5 w-2.5 text-primary" />
                ) : stage.status === "failed" ? (
                  <X className="h-2.5 w-2.5 text-danger" />
                ) : (
                  <Icon className={cn("h-2.5 w-2.5", isActive ? "text-primary" : "text-muted-foreground/40")} />
                )}
              </div>
              <span className={cn(
                "text-xs flex-1",
                isActive ? "font-medium text-foreground" : isPast ? "text-foreground/70" : "text-muted-foreground/50",
              )}>
                {stage.label}
              </span>
              {stage.detail && (
                <span className={cn(
                  "text-[10px] font-mono",
                  isPast ? "text-muted-foreground" : "text-muted-foreground/40",
                  stage.stage === "decision" && decisionColors[replay.decision],
                )}>
                  {stage.detail}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="h-1 rounded-full bg-elevated mb-4 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: isComplete ? "100%" : `${(currentStep / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button variant="ghost" size="icon-xs" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={stepBack} disabled={currentStep === 0}>
          <SkipBack className="h-3.5 w-3.5" />
        </Button>
        <Button variant={isPlaying ? "secondary" : "default"} size="icon-sm" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={stepForward} disabled={isComplete}>
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[10px] text-muted-foreground/60 font-mono ml-1">
          {currentStep + 1}/{totalSteps}
        </span>
      </div>
    </Card>
  );
}

export { MissionReplay };
