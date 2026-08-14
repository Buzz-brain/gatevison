import { motion } from "framer-motion";
import { Check, X, AlertTriangle, Timer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { StageState, StageStatus } from "../types";

interface PipelineNodeProps {
  stage: StageState;
  index: number;
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

function PipelineNode({ stage, index }: PipelineNodeProps) {
  const prefersReduced = useReducedMotion();
  const config = statusConfig[stage.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors",
        config.bg,
        config.border,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", config.color, stage.status === "processing" && "animate-spin")} />
      <div className="min-w-0 flex-1">
        <p className={cn(
          "truncate text-[11px] font-medium leading-tight",
          stage.status === "inactive" ? "text-muted-foreground/50" : "text-foreground",
        )}>
          {stage.label}
        </p>
        {stage.status !== "inactive" && (
          <p className={cn("truncate text-[9px] uppercase tracking-wider", config.color)}>
            {config.label}
            {stage.duration ? ` · ${stage.duration}ms` : ""}
          </p>
        )}
      </div>
      {stage.confidence != null && stage.status !== "inactive" && (
        <span className="shrink-0 rounded bg-surface px-1 py-0.5 text-[9px] font-mono text-muted-foreground">
          {stage.confidence.toFixed(0)}%
        </span>
      )}
    </motion.div>
  );
}

export { PipelineNode };
