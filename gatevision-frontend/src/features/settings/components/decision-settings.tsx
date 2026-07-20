import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Zap, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { fadeIn, staggerContainer, staggerItem } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { DecisionWeights, DecisionPreview } from "../types";

interface DecisionSettingsProps {
  weights: DecisionWeights;
  onUpdateWeights: (update: Partial<DecisionWeights>) => void;
  decisionPreview: DecisionPreview;
}

const WEIGHT_KEYS = ["plate", "ocr", "face", "vehicle"] as const;

const WEIGHT_CONFIG: Record<string, { label: string; color: string; bgColor: string; trackColor: string; icon: string }> = {
  plate: { label: "Plate Detection", color: "text-blue-400", bgColor: "bg-blue-500", trackColor: "#3b82f6", icon: "1" },
  ocr: { label: "OCR Recognition", color: "text-emerald-400", bgColor: "bg-emerald-500", trackColor: "#10b981", icon: "2" },
  face: { label: "Face Recognition", color: "text-violet-400", bgColor: "bg-violet-500", trackColor: "#8b5cf6", icon: "3" },
  vehicle: { label: "Vehicle Fingerprint", color: "text-amber-400", bgColor: "bg-amber-500", trackColor: "#f59e0b", icon: "4" },
};

function DecisionSettings({ weights, onUpdateWeights, decisionPreview }: DecisionSettingsProps) {
  const prefersReduced = useReducedMotion();
  const [interactingKey, setInteractingKey] = useState<string | null>(null);

  const total = useMemo(
    () => weights.plate + weights.ocr + weights.face + weights.vehicle,
    [weights],
  );

  const percentages = useMemo(() => {
    if (total === 0) return { plate: 25, ocr: 25, face: 25, vehicle: 25 };
    return {
      plate: Math.round((weights.plate / total) * 100),
      ocr: Math.round((weights.ocr / total) * 100),
      face: Math.round((weights.face / total) * 100),
      vehicle: Math.round((weights.vehicle / total) * 100),
    };
  }, [weights, total]);

  const handleWeightChange = useCallback(
    (changedKey: string, newValue: number) => {
      const clamped = Math.max(0, Math.min(100, newValue));
      const others = WEIGHT_KEYS.filter((k) => k !== changedKey);
      const otherSum = others.reduce((sum, k) => sum + weights[k], 0);

      if (otherSum === 0) {
        const each = Math.round(clamped / others.length);
        onUpdateWeights({
          [changedKey]: clamped,
          [others[0]!]: each,
          [others[1]!]: each,
          [others[2]!]: clamped - each * 2,
        });
        return;
      }

      const remaining = 100 - clamped;
      const scale = remaining / otherSum;
      const updates: Partial<DecisionWeights> = { [changedKey]: clamped };

      let allocated = clamped;
      for (let i = 0; i < others.length; i++) {
        const k = others[i]!;
        if (i === others.length - 1) {
          updates[k] = 100 - allocated;
        } else {
          const scaled = Math.round(weights[k]! * scale);
          updates[k] = scaled;
          allocated += scaled;
        }
      }

      onUpdateWeights(updates);
    },
    [weights, onUpdateWeights],
  );

  const decisionConfig = useMemo(() => {
    switch (decisionPreview.decision) {
      case "GRANT":
        return { label: "GRANT ACCESS", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30", Icon: CheckCircle2 };
      case "DENY":
        return { label: "DENY ACCESS", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/30", Icon: XCircle };
      case "MANUAL_REVIEW":
        return { label: "MANUAL REVIEW", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30", Icon: AlertTriangle };
    }
  }, [decisionPreview.decision]);

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerContainer}
      initial={prefersReduced ? undefined : "hidden"}
      animate="visible"
      className="space-y-6"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <motion.div variants={prefersReduced ? undefined : fadeIn}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Decision Weights
              </CardTitle>
              <CardDescription>
                Adjust how each recognition factor contributes to the final access decision. Total always equals 100%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {WEIGHT_KEYS.map((key) => {
                const config = WEIGHT_CONFIG[key]!;
                const value = weights[key]!;
                const pct = percentages[key]!;
                const isInteracting = interactingKey === key;

                return (
                  <motion.div
                    key={key}
                    variants={prefersReduced ? undefined : staggerItem}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white", config.bgColor)}>
                          {config.icon}
                        </span>
                        <span className="text-sm font-medium">{config.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-mono font-semibold tabular-nums", config.color)}>
                          {pct}%
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({value})
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={value}
                        onChange={(e) => handleWeightChange(key, Number(e.target.value))}
                        onMouseDown={() => setInteractingKey(key)}
                        onMouseUp={() => setInteractingKey(null)}
                        onTouchStart={() => setInteractingKey(key)}
                        onTouchEnd={() => setInteractingKey(null)}
                        className={cn(
                          "h-2 w-full cursor-pointer appearance-none rounded-full bg-surface",
                          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform",
                          isInteracting && "[&::-webkit-slider-thumb]:scale-125",
                          config.bgColor,
                        )}
                        style={{
                          background: `linear-gradient(to right, ${config.trackColor} ${pct}%, hsl(var(--surface)) ${pct}%)`,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Weight</span>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-mono font-bold", total === 100 ? "text-emerald-400" : "text-red-400")}>
                    {total}%
                  </span>
                  {total !== 100 && (
                    <Badge variant="danger" size="sm">Imbalanced</Badge>
                  )}
                </div>
              </div>

              <button
                onClick={() => onUpdateWeights({ plate: 25, ocr: 25, face: 25, vehicle: 25 })}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground"
              >
                Reset to Balanced
              </button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={prefersReduced ? undefined : fadeIn}>
          <AnimatePresence mode="wait">
            <motion.div
              key={decisionPreview.decision}
              initial={prefersReduced ? undefined : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReduced ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={cn("border", decisionConfig.borderColor, decisionConfig.bgColor)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Live Decision Preview
                  </CardTitle>
                  <CardDescription>
                    Simulated outcome based on current weight configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className={cn("flex items-center justify-center gap-3 rounded-lg border p-6", decisionConfig.borderColor, decisionConfig.bgColor)}>
                    <decisionConfig.Icon className={cn("h-8 w-8", decisionConfig.color)} />
                    <span className={cn("text-2xl font-bold tracking-wider", decisionConfig.color)}>
                      {decisionConfig.label}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className="text-sm font-mono font-semibold">{decisionPreview.confidence}%</span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-surface">
                      <motion.div
                        className={cn("h-full rounded-full", {
                          "bg-emerald-500": decisionPreview.decision === "GRANT",
                          "bg-red-500": decisionPreview.decision === "DENY",
                          "bg-amber-500": decisionPreview.decision === "MANUAL_REVIEW",
                        })}
                        initial={prefersReduced ? undefined : { width: 0 }}
                        animate={{ width: `${decisionPreview.confidence}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Individual Scores</p>
                    {WEIGHT_KEYS.map((key) => {
                      const config = WEIGHT_CONFIG[key]!;
                      const score = decisionPreview.scores[key];
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{config.label}</span>
                          <span className={cn("text-xs font-mono font-medium", config.color)}>
                            {score !== undefined ? Math.round(score * 100) : "--"}%
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Processing Latency</span>
                    <span className="text-sm font-mono">{decisionPreview.latency}ms</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}

export { DecisionSettings };
