import { useState, useMemo, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { fadeIn } from "@/lib/animations";
import {
  FlaskConical, Sliders, Gauge, Shield, Zap, Clock, BrainCircuit,
  CheckCircle2, XCircle, AlertTriangle, BarChart3, TrendingUp, TrendingDown,
  RefreshCw, RotateCcw,
} from "lucide-react";
import type { DecisionWeights, SimulatorMetrics, ConfigImpact, SimulatorPreset } from "../types";
import { SIMULATOR_PRESETS, computeSimulatorMetrics, computeImpact } from "../utils";

interface AiConfigSimulatorProps {
  weights: DecisionWeights;
  onWeightsChange: (update: Partial<DecisionWeights>) => void;
  yoloConfidence: number;
  ocrThreshold: number;
  faceThreshold: number;
  metrics: SimulatorMetrics;
  impact: ConfigImpact;
}

function AnimatedMetricCard({
  title, value, icon, color, suffix, delay = 0,
}: {
  title: string; value: string | number; icon: ReactNode; color: string; suffix?: string; delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: reduced ? 0 : 0.2 }}
      className="rounded-lg bg-elevated border border-border p-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className={cn("flex h-6 w-6 items-center justify-center rounded", color)}>{icon}</div>
      </div>
      <p className={cn("mt-1 text-lg font-semibold", color.replace("bg-", "text-").replace("/10", ""))}>
        {value}{suffix ?? ""}
      </p>
    </motion.div>
  );
}

function DirectionBadge({ direction, label }: { direction: "up" | "down"; label: string }) {
  const up = direction === "up";
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-success" : "text-danger")}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {label}
    </span>
  );
}

function ImpactBar({ label, value, direction, color }: { label: string; value: number; direction: "up" | "down"; color: string }) {
  const reduced = useReducedMotion();
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <DirectionBadge direction={direction} label={`${value}%`} />
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-surface">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: reduced ? 0 : 0.5, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

function AiConfigSimulator({
  weights, onWeightsChange, yoloConfidence, ocrThreshold, faceThreshold, metrics, impact,
}: AiConfigSimulatorProps) {
  const reduced = useReducedMotion();
  const [activePreset, setActivePreset] = useState("current");
  const [simYolo, setSimYolo] = useState(yoloConfidence);
  const [simOcr, setSimOcr] = useState(ocrThreshold);
  const [simFace, setSimFace] = useState(faceThreshold);
  const [simWeights, setSimWeights] = useState<DecisionWeights>(weights);
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  const simMetrics: SimulatorMetrics = useMemo(
    () => computeSimulatorMetrics({ yoloConfidence: simYolo, ocrThreshold: simOcr, faceThreshold: simFace, weights: simWeights }),
    [simYolo, simOcr, simFace, simWeights],
  );

  const simImpact: ConfigImpact = useMemo(
    () => computeImpact({ yoloConfidence: simYolo, ocrThreshold: simOcr, faceThreshold: simFace, weights: simWeights }),
    [simYolo, simOcr, simFace, simWeights],
  );

  const overallConfidence = simMetrics.overallConfidence;
  const decision = overallConfidence > 75 ? "GRANT" : overallConfidence > 45 ? "MANUAL_REVIEW" : "DENY";

  const applyPreset = useCallback((preset: SimulatorPreset) => {
    setActivePreset(preset.id);
    setSimYolo(preset.yoloConfidence);
    setSimOcr(preset.ocrThreshold);
    setSimFace(preset.faceThreshold);
    setSimWeights(preset.weights);
  }, []);

  const applyToLive = useCallback(() => {
    onWeightsChange(simWeights);
  }, [simWeights, onWeightsChange]);

  const handleWeightChange = (key: keyof DecisionWeights, newValue: number) => {
    const diff = newValue - simWeights[key];
    const otherKeys = (Object.keys(simWeights) as (keyof DecisionWeights)[]).filter((k) => k !== key);
    const totalOthers = otherKeys.reduce((sum, k) => sum + simWeights[k], 0);

    let updated = { ...simWeights, [key]: newValue };
    if (totalOthers > 0) {
      const remaining = 100 - newValue;
      for (const k of otherKeys) {
        const proportion = totalOthers > 0 ? simWeights[k] / totalOthers : 1 / otherKeys.length;
        updated[k] = Math.round(remaining * proportion);
      }
      const currentTotal = Object.values(updated).reduce((a, b) => a + b, 0);
      const diff2 = 100 - currentTotal;
      if (diff2 !== 0 && otherKeys.length > 0) {
        updated[otherKeys[0]!] += diff2;
      }
    }
    setSimWeights(updated);
    setActivePreset("");
  };

  const decisionColor = decision === "GRANT" ? "text-success" : decision === "DENY" ? "text-danger" : "text-warning";
  const decisionBg = decision === "GRANT" ? "bg-success/10 border-success/30" : decision === "DENY" ? "bg-danger/10 border-danger/30" : "bg-warning/10 border-warning/30";

  return (
    <div className="space-y-5">
      {/* Presets bar */}
      <div className="flex flex-wrap gap-2">
        {SIMULATOR_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant={activePreset === preset.id ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset(preset)}
          >
            {preset.id === "current" ? <RefreshCw className="mr-1 h-3.5 w-3.5" /> : preset.id === "balanced" ? <BarChart3 className="mr-1 h-3.5 w-3.5" /> : preset.id === "performance" ? <Zap className="mr-1 h-3.5 w-3.5" /> : <Shield className="mr-1 h-3.5 w-3.5" />}
            {preset.name}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: Controls */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sliders className="h-4 w-4" />AI Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">YOLO Confidence</span>
                  <span className="font-mono font-medium">{Math.round(simYolo * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={99}
                  value={Math.round(simYolo * 100)}
                  onChange={(e) => { setSimYolo(Number(e.target.value) / 100); setActivePreset(""); }}
                  className="w-full accent-primary"
                  aria-label="YOLO Confidence Threshold"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">OCR Threshold</span>
                  <span className="font-mono font-medium">{Math.round(simOcr * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={99}
                  value={Math.round(simOcr * 100)}
                  onChange={(e) => { setSimOcr(Number(e.target.value) / 100); setActivePreset(""); }}
                  className="w-full accent-primary"
                  aria-label="OCR Minimum Confidence"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Face Threshold</span>
                  <span className="font-mono font-medium">{Math.round(simFace * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={99}
                  value={Math.round(simFace * 100)}
                  onChange={(e) => { setSimFace(Number(e.target.value) / 100); setActivePreset(""); }}
                  className="w-full accent-primary"
                  aria-label="Face Similarity Threshold"
                />
              </div>

              <Separator />

              <p className="text-xs font-medium text-muted-foreground">Decision Weights</p>
              <div className="space-y-3">
                {(["plate", "ocr", "face", "vehicle"] as const).map((key) => (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{key}</span>
                      <span className="font-mono font-medium">{simWeights[key]}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={simWeights[key]}
                      onChange={(e) => handleWeightChange(key, Number(e.target.value))}
                      className="w-full accent-primary"
                      aria-label={`${key} weight`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-xs">
                <span className="text-muted-foreground">Total</span>
                <span className={cn("font-mono font-bold", Object.values(simWeights).reduce((a, b) => a + b, 0) === 100 ? "text-success" : "text-danger")}>
                  {Object.values(simWeights).reduce((a, b) => a + b, 0)}%
                </span>
              </div>

              <Button size="sm" className="w-full" onClick={applyToLive}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" />Apply to Live
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Center: Metrics */}
        <div className="space-y-4 lg:col-span-1">
          {/* Decision preview */}
          <motion.div
            animate={{ scale: reduced ? 1 : [1, 1.02, 1] }}
            transition={{ duration: 0.3 }}
            className={cn("rounded-xl border-2 p-4 text-center transition-colors", decisionBg)}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Decision</p>
            <AnimatePresence mode="wait">
              <motion.p
                key={decision}
                initial={reduced ? {} : { scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={reduced ? {} : { scale: 0.8, opacity: 0 }}
                className={cn("mt-1 text-2xl font-bold", decisionColor)}
              >
                {decision === "GRANT" ? <><CheckCircle2 className="mr-1 inline h-5 w-5" />GRANT</> : decision === "DENY" ? <><XCircle className="mr-1 inline h-5 w-5" />DENY</> : <><AlertTriangle className="mr-1 inline h-5 w-5" />MANUAL REVIEW</>}
              </motion.p>
            </AnimatePresence>
            <p className="mt-1 text-xs text-muted-foreground">Confidence: {overallConfidence}%</p>
            <Progress value={overallConfidence} className="mt-2 h-1.5" />
          </motion.div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2">
            <AnimatedMetricCard title="Plate Accuracy" value={simMetrics.plateAccuracy} icon={<BrainCircuit className="h-3 w-3 text-white" />} color="bg-blue-500/10" suffix="%" delay={0} />
            <AnimatedMetricCard title="Char Accuracy" value={simMetrics.charAccuracy} icon={<BrainCircuit className="h-3 w-3 text-white" />} color="bg-violet-500/10" suffix="%" delay={0.05} />
            <AnimatedMetricCard title="Security Score" value={simMetrics.securityScore} icon={<Shield className="h-3 w-3 text-white" />} color="bg-green-500/10" suffix="%" delay={0.1} />
            <AnimatedMetricCard title="Inference Time" value={simMetrics.inferenceTime} icon={<Clock className="h-3 w-3 text-white" />} color="bg-amber-500/10" suffix="ms" delay={0.15} />
          </div>

          <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAllMetrics(!showAllMetrics)}>
            {showAllMetrics ? "Hide" : "Show"} Detailed Metrics
          </Button>

          <AnimatePresence>
            {showAllMetrics && (
              <motion.div
                initial={reduced ? {} : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduced ? {} : { height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded bg-surface p-2"><span className="text-muted-foreground">FP Rate</span><p className="font-medium">{simMetrics.falsePositiveRate}</p></div>
                      <div className="rounded bg-surface p-2"><span className="text-muted-foreground">Processing</span><p className="font-medium">{simMetrics.processingTime}ms</p></div>
                      <div className="rounded bg-surface p-2"><span className="text-muted-foreground">Manual Review</span><p className="font-medium">{simMetrics.manualReviewRate}%</p></div>
                      <div className="rounded bg-surface p-2"><span className="text-muted-foreground">FAR</span><p className="font-medium">{simMetrics.falseAcceptanceRate}</p></div>
                      <div className="rounded bg-surface p-2"><span className="text-muted-foreground">FRR</span><p className="font-medium">{simMetrics.falseRejectionRate}</p></div>
                      <div className="rounded bg-surface p-2"><span className="text-muted-foreground">Latency</span><p className="font-medium">{simMetrics.processingLatency}ms</p></div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Decision Probabilities</p>
                      <div className="flex h-5 overflow-hidden rounded-full text-xs font-medium text-white">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${simMetrics.grantProbability}%` }}
                          className="flex items-center justify-center bg-success"
                          transition={{ duration: reduced ? 0 : 0.4 }}
                        >{simMetrics.grantProbability > 15 ? `${simMetrics.grantProbability}%` : ""}</motion.div>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${simMetrics.reviewProbability}%` }}
                          className="flex items-center justify-center bg-warning text-foreground"
                          transition={{ duration: reduced ? 0 : 0.4, delay: 0.1 }}
                        >{simMetrics.reviewProbability > 15 ? `${simMetrics.reviewProbability}%` : ""}</motion.div>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${simMetrics.denyProbability}%` }}
                          className="flex items-center justify-center bg-danger"
                          transition={{ duration: reduced ? 0 : 0.4, delay: 0.2 }}
                        >{simMetrics.denyProbability > 15 ? `${simMetrics.denyProbability}%` : ""}</motion.div>
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Grant: {simMetrics.grantProbability}%</span>
                        <span>Review: {simMetrics.reviewProbability}%</span>
                        <span>Deny: {simMetrics.denyProbability}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Impact */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Gauge className="h-4 w-4" />System Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImpactBar
                label="Recognition Speed"
                value={simImpact.recognitionSpeed.value}
                direction={simImpact.recognitionSpeed.direction}
                color={simImpact.recognitionSpeed.direction === "up" ? "bg-success" : "bg-danger"}
              />
              <ImpactBar
                label="Accuracy"
                value={simImpact.accuracy.value}
                direction={simImpact.accuracy.direction}
                color={simImpact.accuracy.direction === "up" ? "bg-success" : "bg-danger"}
              />
              <ImpactBar
                label="Storage Usage"
                value={simImpact.storage.value}
                direction={simImpact.storage.direction}
                color={simImpact.storage.direction === "up" ? "bg-danger" : "bg-success"}
              />
              <ImpactBar
                label="Security"
                value={simImpact.security.value}
                direction={simImpact.security.direction}
                color={simImpact.security.direction === "up" ? "bg-success" : "bg-danger"}
              />
              <ImpactBar
                label="Latency"
                value={simImpact.latency.value}
                direction={simImpact.latency.direction}
                color={simImpact.latency.direction === "up" ? "bg-danger" : "bg-success"}
              />
            </CardContent>
          </Card>

          {/* Scenario comparison */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BarChart3 className="h-4 w-4" />Preset Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {SIMULATOR_PRESETS.filter((p) => p.id !== "current").map((preset) => {
                const pMetrics = computeSimulatorMetrics({
                  yoloConfidence: preset.yoloConfidence, ocrThreshold: preset.ocrThreshold,
                  faceThreshold: preset.faceThreshold, weights: preset.weights,
                });
                return (
                  <div key={preset.id} className="rounded-lg bg-surface p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{preset.name}</span>
                      <Badge variant={preset.id === "security" ? "danger" : preset.id === "performance" ? "warning" : "default"} size="sm">
                        {pMetrics.overallConfidence}%
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-muted-foreground">{preset.description}</p>
                    <div className="mt-1.5 flex gap-2 text-[10px] text-muted-foreground">
                      <span>Accuracy: {pMetrics.charAccuracy}%</span>
                      <span>Security: {pMetrics.securityScore}</span>
                      <span>Latency: {pMetrics.processingLatency}ms</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="mt-1 h-6 w-full"
                      onClick={() => applyPreset(preset)}
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />Apply Preset
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { AiConfigSimulator };
