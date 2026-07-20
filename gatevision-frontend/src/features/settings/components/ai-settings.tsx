import { useState } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit, Cpu, Zap, RotateCcw, Power, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useSettings } from "../hooks/use-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { DEVICE_OPTIONS, PERFORMANCE_OPTIONS } from "../utils";
import { timeAgo } from "../utils";

const MODEL_ICONS: Record<string, React.ElementType> = {
  yolo: Zap,
  easyocr: BrainCircuit,
  insightface: BrainCircuit,
  resnet50: Cpu,
  decision: BrainCircuit,
};

const MODEL_COLORS: Record<string, string> = {
  yolo: "text-yellow-400 bg-yellow-400/10",
  easyocr: "text-blue-400 bg-blue-400/10",
  insightface: "text-purple-400 bg-purple-400/10",
  resnet50: "text-green-400 bg-green-400/10",
  decision: "text-orange-400 bg-orange-400/10",
};

const DEVICE_TOOLTIPS: Record<string, string> = {
  Auto: "Automatically selects the best available compute device",
  CPU: "Run on CPU - slower but universally available",
  GPU: "Run on GPU via CUDA - fastest inference speed",
  TPU: "Run on Google TPU - optimized for large batches",
};

const PERF_TOOLTIPS: Record<string, string> = {
  balanced: "Equal trade-off between speed and accuracy",
  accuracy: "Maximize recognition accuracy at the cost of speed",
  speed: "Maximize throughput at the cost of some accuracy",
};

function AiSettings() {
  const prefersReduced = useReducedMotion();
  const { models, updateModels } = useSettings();
  const [lastReloadedMap, setLastReloadedMap] = useState<Record<string, string>>({});

  function handleReload(id: string) {
    const now = new Date().toISOString();
    setLastReloadedMap((prev) => ({ ...prev, [id]: now }));
    updateModels(id, { lastReloaded: now });
  }

  return (
    <motion.div
      variants={prefersReduced ? undefined : staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex items-center gap-2">
        <BrainCircuit className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">AI Model Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Configure inference devices, confidence thresholds, and performance modes
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {models.map((model) => {
          const Icon = MODEL_ICONS[model.id] ?? Cpu;
          const colorClass = MODEL_COLORS[model.id] ?? "text-primary bg-primary/10";
          const reloadTime = lastReloadedMap[model.id] ?? model.lastReloaded;

          return (
            <motion.div
              key={model.id}
              variants={prefersReduced ? undefined : staggerItem}
              layout
            >
              <Card
                className={cn(
                  "transition-all",
                  !model.enabled && "opacity-60",
                )}
              >
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", colorClass)}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{model.name}</p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono">
                          v{model.version}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={model.enabled}
                      onCheckedChange={(val) => updateModels(model.id, { enabled: val })}
                    />
                  </div>

                  <div className="space-y-1.5 rounded-lg bg-surface/50 px-3 py-2">
                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Model Path</p>
                    <p className="text-xs font-mono text-muted-foreground break-all">{model.modelPath}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs">Device</Label>
                        <Tooltip content={DEVICE_TOOLTIPS[model.device] ?? "Compute device"} side="top">
                          <Info className="h-3 w-3 text-muted-foreground/40" />
                        </Tooltip>
                      </div>
                      <Select
                        value={model.device}
                        onChange={(e) =>
                          updateModels(model.id, {
                            device: e.target.value as "CPU" | "GPU" | "TPU" | "Auto",
                          })
                        }
                        options={DEVICE_OPTIONS}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-xs">Confidence Threshold</Label>
                          <Tooltip
                            content="Minimum confidence score for the model to consider a detection valid"
                            side="top"
                          >
                            <Info className="h-3 w-3 text-muted-foreground/40" />
                          </Tooltip>
                        </div>
                        <span className="text-xs font-mono text-primary">
                          {(model.confidenceThreshold * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={0.99}
                        step={0.01}
                        value={model.confidenceThreshold}
                        onChange={(e) =>
                          updateModels(model.id, { confidenceThreshold: Number(e.target.value) })
                        }
                        className="w-full h-1.5 rounded-full bg-border accent-primary cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground/50">
                        <span>10%</span>
                        <span>99%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs">Performance Mode</Label>
                        <Tooltip
                          content={PERF_TOOLTIPS[model.performanceMode] ?? "Performance trade-off mode"}
                          side="top"
                        >
                          <Info className="h-3 w-3 text-muted-foreground/40" />
                        </Tooltip>
                      </div>
                      <Select
                        value={model.performanceMode}
                        onChange={(e) =>
                          updateModels(model.id, {
                            performanceMode: e.target.value as "balanced" | "accuracy" | "speed",
                          })
                        }
                        options={PERFORMANCE_OPTIONS}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {reloadTime && (
                        <p className="text-[10px] text-muted-foreground/60">
                          Last reload: {timeAgo(reloadTime)}
                        </p>
                      )}
                    </div>
                    <Tooltip content="Reload model with current settings" side="top">
                      <Button
                        variant="outline"
                        size="icon-xs"
                        onClick={() => handleReload(model.id)}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export { AiSettings };
