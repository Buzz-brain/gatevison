import { motion } from "framer-motion";
import { Check, X, AlertTriangle, Timer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { StageState, StageStatus } from "../types";

interface PipelineNodeProps {
  stage: StageState;
  index: number;
  isLast?: boolean;
}

const statusConfig: Record<StageStatus, {
  icon: typeof Check;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  inactive: { icon: Timer, color: "text-muted-foreground/50", bg: "bg-surface", border: "border-border", label: "Pending" },
  processing: { icon: Loader2, color: "text-primary", bg: "bg-primary/10", border: "border-primary/40", label: "Processing" },
  completed: { icon: Check, color: "text-success", bg: "bg-success/10", border: "border-success/30", label: "Completed" },
  failed: { icon: X, color: "text-danger", bg: "bg-danger/10", border: "border-danger/30", label: "Failed" },
  manual_review: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", label: "Review" },
};

function PipelineNode({ stage, index, isLast }: PipelineNodeProps) {
  const prefersReduced = useReducedMotion();
  const config = statusConfig[stage.status];
  const Icon = config.icon;

  return (
    <div className="relative">
      <motion.div
        initial={prefersReduced ? undefined : { opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "flex items-start gap-3 rounded-lg border p-3 transition-colors",
          config.bg,
          config.border,
        )}
      >
        {/* Status icon */}
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
          config.border,
          config.bg,
        )}>
          <Icon className={cn("h-4 w-4", config.color, stage.status === "processing" && "animate-spin")} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "text-sm font-medium",
              stage.status === "inactive" ? "text-muted-foreground/50" : "text-foreground",
            )}>
              {stage.label}
            </span>
            <span className={cn("text-[10px] uppercase tracking-wider", config.color)}>
              {config.label}
            </span>
          </div>

          {stage.detail && (
            <p className={cn(
              "mt-0.5 text-xs font-mono",
              stage.status === "failed" ? "text-danger" :
              stage.status === "manual_review" ? "text-warning" :
              stage.status === "completed" ? "text-muted-foreground" :
              "text-primary",
            )}>
              {stage.detail}
            </p>
          )}

          {stage.duration && (
            <span className="text-[10px] text-muted-foreground/50">
              ~{stage.duration}ms
            </span>
          )}
        </div>

        {/* Confidence badge */}
        {stage.confidence != null && stage.status !== "inactive" && (
          <span className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono",
            stage.confidence >= 90 ? "bg-success/10 text-success" :
            stage.confidence >= 70 ? "bg-warning/10 text-warning" :
            "bg-danger/10 text-danger",
          )}>
            {stage.confidence.toFixed(1)}%
          </span>
        )}
      </motion.div>

      {/* Connector */}
      {!isLast && (
        <div className={cn(
          "ml-7 h-4 w-px",
          stage.status === "completed" ? "bg-primary/40" : "bg-border",
        )} />
      )}
    </div>
  );
}

export { PipelineNode };
