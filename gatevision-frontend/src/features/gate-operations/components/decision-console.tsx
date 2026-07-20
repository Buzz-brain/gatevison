import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Circle, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { DecisionFlow, DecisionKey } from "../types";
import { decisionConfig } from "../utils";

interface DecisionConsoleProps {
  decisionFlow: DecisionFlow | null;
  onTrigger: () => void;
}

const STAGES: { key: DecisionKey; label: string }[] = [
  { key: "recognition", label: "Recognition Complete" },
  { key: "decision", label: "Decision" },
  { key: "barrier_opening", label: "Barrier Opening" },
  { key: "vehicle_passing", label: "Vehicle Passing" },
  { key: "session_created", label: "Session Created" },
];

export function DecisionConsole({ decisionFlow, onTrigger }: DecisionConsoleProps) {
  const prefersReduced = useReducedMotion();
  const activeIndex = decisionFlow
    ? STAGES.findIndex((s) => s.key === decisionFlow.activeStage)
    : -1;

  const getStageState = (i: number): "done" | "active" | "pending" => {
    if (!decisionFlow) return "pending";
    if (decisionFlow.activeStage === STAGES[i]?.key) return "active";
    if (activeIndex >= 0 && i < activeIndex) return "done";
    return "pending";
  };

  const result = decisionFlow ? decisionConfig[decisionFlow.result] : null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Decision</p>
          {decisionFlow ? (
            <p className="mt-1 truncate text-sm font-medium">
              <span className="font-mono">{decisionFlow.plate}</span>
              <span className="mx-2 text-muted-foreground">/</span>
              {decisionFlow.driver}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No active vehicle</p>
          )}
        </div>
        {result ? (
          <Badge variant={result.variant}>{result.label}</Badge>
        ) : (
          <Badge variant="neutral">IDLE</Badge>
        )}
      </div>

      {decisionFlow && (
        <p className="mt-2 text-xs text-muted-foreground">
          Confidence:
          <span className="ml-1 font-mono">{decisionFlow.confidence.toFixed(1)}%</span>
        </p>
      )}

      <div className="mt-4 flex flex-col">
        {STAGES.map((stage, i) => {
          const state = getStageState(i);
          return (
            <div key={stage.key}>
              <motion.div
                className="flex items-center gap-3"
                initial={prefersReduced ? undefined : { opacity: 0, x: -8 }}
                animate={prefersReduced ? undefined : { opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div
                  className={
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border " +
                    (state === "active"
                      ? "border-primary bg-primary/10 text-primary"
                      : state === "done"
                        ? "border-success/40 bg-success/10 text-success"
                        : "border-border bg-elevated text-muted-foreground")
                  }
                >
                  {state === "done" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : state === "active" ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={
                    "text-sm " +
                    (state === "active"
                      ? "font-medium text-foreground"
                      : state === "done"
                        ? "text-foreground"
                        : "text-muted-foreground")
                  }
                >
                  {stage.label}
                </span>
              </motion.div>
              {i < STAGES.length - 1 && (
                <div className="ml-4 py-1">
                  <ChevronDown className="h-4 w-4 text-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button className="mt-4 w-full" variant="default" onClick={onTrigger}>
        Process Next Vehicle
      </Button>
    </Card>
  );
}
