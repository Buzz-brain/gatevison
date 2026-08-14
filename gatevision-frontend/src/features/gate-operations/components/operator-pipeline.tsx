import { motion } from "framer-motion";
import { Video, ScanText, Car, UserCheck, Scale, DoorOpen, CheckCircle2, Loader2, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { DecisionFlow } from "../types";

interface OperatorPipelineProps {
  decisionFlow: DecisionFlow | null;
}

const ENTRY_STAGES = [
  { key: "recognition", label: "Vehicle Detected", sub: "Vehicle approaching the gate lane" },
  { key: "recognition", label: "Plate Read", sub: "License plate captured and OCR complete" },
  { key: "recognition", label: "Vehicle Identified", sub: "Vehicle matched to registered profile" },
  { key: "decision", label: "Driver Verified", sub: "Identity and access rights confirmed" },
  { key: "decision", label: "Decision Made", sub: "Access request evaluated" },
  { key: "barrier", label: "Gate Opened", sub: "Barrier raised for entry" },
];

const EXIT_STAGES = [
  { key: "recognition", label: "Vehicle Detected", sub: "Vehicle approaching the gate lane" },
  { key: "recognition", label: "Plate Read", sub: "License plate captured and OCR complete" },
  { key: "session", label: "Session Matched", sub: "Active entry session located" },
  { key: "decision", label: "Driver Verified", sub: "Identity and access rights confirmed" },
  { key: "decision", label: "Decision Made", sub: "Exit request evaluated" },
  { key: "barrier", label: "Gate Opened", sub: "Barrier raised for exit" },
];

const STAGE_ICONS = [Video, ScanText, Car, UserCheck, Scale, DoorOpen];

function activeIndexFor(stage: string, mode: "entry" | "exit"): number {
  if (stage === "barrier_opening" || stage === "vehicle_passing") return 5;
  if (stage === "session_created" || stage === "session_closed") return 6;
  if (mode === "exit") {
    if (stage === "session_matching") return 2;
    if (stage === "verification") return 4;
    if (stage === "decision") return 4;
  }
  if (stage === "recognition") return 2;
  if (stage === "decision") return 4;
  return 0;
}

function currentActivity(index: number, stages: typeof ENTRY_STAGES): string {
  if (index >= stages.length) return "Vehicle passed — session complete";
  return stages[index]?.sub ?? "Processing...";
}

function OperatorPipeline({ decisionFlow }: OperatorPipelineProps) {
  const prefersReduced = useReducedMotion();
  const mode: "entry" | "exit" = decisionFlow?.mode ?? "entry";
  const STAGES = mode === "exit" ? EXIT_STAGES : ENTRY_STAGES;

  const running = decisionFlow != null;
  const activeIndex = decisionFlow ? activeIndexFor(decisionFlow.activeStage ?? "", mode) : -1;
  const progress = running ? Math.min(100, Math.round(((activeIndex + 1) / (STAGES.length + 1)) * 100)) : 0;
  const doneCount = running ? Math.min(STAGES.length, activeIndex + 1) : 0;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
          Live Pipeline
        </p>
        {running ? (
          <Badge variant="info">{decisionFlow?.mode === "entry" ? "ENTRY" : "EXIT"} IN PROGRESS</Badge>
        ) : (
          <Badge variant="neutral">IDLE</Badge>
        )}
      </div>

      {/* Current activity + plate */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {running ? currentActivity(activeIndex, STAGES) : "Waiting for vehicle at gate"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {running ? (
              <>
                Plate <span className="font-mono">{decisionFlow?.plate}</span>
                <span className="mx-1.5 text-muted-foreground/50">/</span>
                Confidence{" "}
                <span className="font-mono">{decisionFlow?.confidence?.toFixed(1)}%</span>
              </>
            ) : (
              "No active access request"
            )}
          </p>
        </div>
        <span className="shrink-0 text-2xl font-semibold tabular-nums">{progress}%</span>
      </div>

      {/* Stepper */}
      <div className="flex items-start">
        {STAGES.map((stage, i) => {
          const Icon = STAGE_ICONS[i] ?? Circle;
          const done = running && i < doneCount;
          const active = running && i === activeIndex;
          return (
            <div key={`${stage.label}-${i}`} className="flex flex-1 items-start">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={prefersReduced ? undefined : { scale: 0.8, opacity: 0.6 }}
                  animate={prefersReduced ? undefined : { scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={
                    "flex h-9 w-9 items-center justify-center rounded-full border " +
                    (done || active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-elevated text-muted-foreground/60")
                  }
                >
                  {active && !done ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : done ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </motion.div>
                <span
                  className={
                    "mt-1.5 max-w-[5.5rem] text-center text-[10px] leading-tight " +
                    (done || active ? "font-medium text-foreground" : "text-muted-foreground/60")
                  }
                >
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className="mt-4 h-px flex-1 bg-border">
                  <div
                    className="h-px bg-primary transition-all duration-500"
                    style={{ width: done ? "100%" : active ? "50%" : "0%" }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export { OperatorPipeline };
