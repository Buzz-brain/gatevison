import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, Shield, Scan, Eye, Fingerprint,
  UserCheck, BrainCircuit, ArrowUpDown, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

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

const stageIcons: Record<string, typeof Scan> = {
  detection: Scan,
  plate: Scan,
  ocr: Eye,
  face: UserCheck,
  fingerprint: Fingerprint,
  identity: Shield,
  decision: BrainCircuit,
  gate: ArrowUpDown,
};

function generateStages() {
  const granted = Math.random() < 0.7;
  const decision = granted ? "granted" : Math.random() < 0.85 ? "denied" : "manual_review";
  const totalMs = 1800 + Math.floor(Math.random() * 400);
  const baseTime = Date.now() - totalMs;

  return DEFAULT_STAGES.map((s, i) => {
    const isDecision = s.stage === "decision";
    const isGate = s.stage === "gate";
    const stageDecision = isDecision ? (decision === "granted" ? "ACCESS GRANTED" : decision === "denied" ? "ACCESS DENIED" : "MANUAL REVIEW") : s.detail;
    const stageStatus = isDecision ? (decision === "granted" ? "completed" : decision === "denied" ? "failed" : "active") : isGate && decision !== "granted" ? "pending" : "completed";
    return {
      stage: s.stage,
      status: stageStatus as "pending" | "active" | "completed" | "failed",
      label: s.label,
      detail: stageDecision,
      timestamp: new Date(baseTime + (i / DEFAULT_STAGES.length) * totalMs).toISOString(),
    };
  });
}

function AiTimeline() {
  const [stages, setStages] = useState<ReturnType<typeof generateStages>>([]);
  const [activeStage, setActiveStage] = useState(-1);
  const [finalDecision, setFinalDecision] = useState<"granted" | "denied" | "manual_review">("granted");
  const [isAnimating, setIsAnimating] = useState(false);
  const prefersReduced = useReducedMotion();

  const startSequence = useCallback(() => {
    const granted = Math.random() < 0.7;
    const decision: "granted" | "denied" | "manual_review" = granted ? "granted" : Math.random() < 0.85 ? "denied" : "manual_review";
    setFinalDecision(decision);
    const newStages = generateStages();
    setStages(newStages);
    setActiveStage(-1);
    setIsAnimating(true);

    if (prefersReduced) {
      setActiveStage(newStages.length);
      setIsAnimating(false);
      return;
    }

    newStages.forEach((_, i) => {
      setTimeout(() => {
        setActiveStage(i);
        if (i === newStages.length - 1) {
          setTimeout(() => setIsAnimating(false), 500);
        }
      }, i * 350);
    });
  }, [prefersReduced]);

  useEffect(() => {
    const timer = setTimeout(startSequence, 500);
    const interval = setInterval(startSequence, 12000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, []);

  const decisionColors = {
    granted: "border-success/30 bg-success/5 text-success",
    denied: "border-danger/30 bg-danger/5 text-danger",
    manual_review: "border-warning/30 bg-warning/5 text-warning",
  };

  const decisionLabels = {
    granted: "ACCESS GRANTED",
    denied: "ACCESS DENIED",
    manual_review: "MANUAL REVIEW",
  };

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">AI Decision Timeline</h3>
        <button
          onClick={startSequence}
          disabled={isAnimating}
          className="text-[10px] text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          {isAnimating ? "Processing..." : "Replay"}
        </button>
      </div>

      <div className="space-y-0">
        {stages.map((stage, i) => {
          const isActive = i === activeStage;
          const isPast = i < activeStage;
          const isFuture = i > activeStage;
          const Icon = stageIcons[stage.stage] || Scan;

          return (
            <motion.div
              key={stage.stage}
              initial={prefersReduced ? undefined : { opacity: 0, x: -8 }}
              animate={{
                opacity: isFuture ? 0.3 : 1,
                x: 0,
              }}
              transition={{ duration: 0.2 }}
              className="relative flex items-start gap-3 pb-3 last:pb-0"
            >
              {i < stages.length - 1 && (
                <div className={cn(
                  "absolute left-[11px] top-6 w-px h-full",
                  isPast ? "bg-primary/40" : "bg-border",
                )} />
              )}

              <div className={cn(
                "relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300",
                isActive ? "border-primary bg-primary/10 shadow-sm shadow-primary/20" : "",
                isPast ? "border-primary/40 bg-primary/5" : "",
                isFuture ? "border-border bg-surface" : "",
              )}>
                {stage.status === "completed" ? (
                  <Check className="h-3 w-3 text-primary" />
                ) : stage.status === "failed" ? (
                  <X className="h-3 w-3 text-danger" />
                ) : isActive ? (
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                ) : (
                  <Icon className="h-3 w-3 text-muted-foreground/50" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm transition-colors",
                    isActive ? "font-medium text-foreground" : isPast ? "text-foreground/80" : "text-muted-foreground/50",
                  )}>
                    {stage.label}
                  </span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="h-1.5 w-1.5 rounded-full bg-primary"
                    />
                  )}
                </div>
                {stage.detail && (
                  <span className={cn(
                    "text-xs font-mono mt-0.5 block",
                    isActive ? "text-primary" : isPast ? "text-muted-foreground" : "text-muted-foreground/40",
                    stage.stage === "decision" && (
                      finalDecision === "granted" ? "text-success font-semibold" :
                      finalDecision === "denied" ? "text-danger font-semibold" :
                      "text-warning font-semibold"
                    ),
                  )}>
                    {stage.detail}
                  </span>
                )}
              </div>

              {stage.timestamp && (
                <span className="shrink-0 text-[10px] text-muted-foreground/40 font-mono">
                  {new Date(stage.timestamp).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeStage === stages.length - 1 && !isAnimating && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "mt-4 rounded-lg border px-4 py-3 text-center",
              decisionColors[finalDecision],
            )}
          >
            <div className="flex items-center justify-center gap-2">
              {finalDecision === "granted" ? (
                <Check className="h-4 w-4" />
              ) : finalDecision === "denied" ? (
                <X className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold tracking-wider">
                {decisionLabels[finalDecision]}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export { AiTimeline };
