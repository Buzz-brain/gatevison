import { motion } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, Lightbulb, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ConfidenceGauge } from "./confidence-gauge";
import type { DecisionResult } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface DecisionPanelProps {
  decision: DecisionResult | null;
}

const decisionConfig = {
  granted: {
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success/5",
    border: "border-success/30",
    title: "ACCESS GRANTED",
    glow: "shadow-[0_0_30px_rgba(34,197,94,0.15)]",
  },
  denied: {
    icon: XCircle,
    color: "text-danger",
    bg: "bg-danger/5",
    border: "border-danger/30",
    title: "ACCESS DENIED",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.15)]",
  },
  manual_review: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/5",
    border: "border-warning/30",
    title: "MANUAL REVIEW",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.15)]",
  },
};

function DecisionPanel({ decision }: DecisionPanelProps) {
  if (!decision) return null;
  const prefersReduced = useReducedMotion();
  const config = decisionConfig[decision.decision];
  const Icon = config.icon;

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className={cn(
        "rounded-xl border p-5",
        config.bg,
        config.border,
        config.glow,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={prefersReduced ? undefined : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 15 }}
            className={cn("flex h-12 w-12 items-center justify-center rounded-full", config.bg)}
          >
            <Icon className={cn("h-6 w-6", config.color)} />
          </motion.div>
          <div>
            <p className={cn("text-lg font-bold tracking-wider", config.color)}>{config.title}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Decision Engine
            </p>
          </div>
        </div>
        <ConfidenceGauge value={decision.confidence} size={70} strokeWidth={7} label="Confidence" />
      </div>

      <div className="mt-4 space-y-2">
        <div className="rounded-lg bg-surface p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1">Reason</p>
          <p className="text-sm">{decision.reason}</p>
        </div>
        <div className="rounded-lg bg-surface p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 mb-1 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Explanation
          </p>
          <p className="text-xs text-muted-foreground/80">{decision.explanation}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-surface p-3">
          <ShieldCheck className={cn("h-4 w-4 shrink-0", config.color)} />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50">Recommended Action</p>
            <p className="text-sm font-medium">{decision.recommendedAction}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { DecisionPanel };
