import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  ScanText,
  UserCheck,
  Network,
  Zap,
  RotateCcw,
  Power,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { STATUS_CONFIG, formatUptime, formatInferenceCount } from "../utils";
import type { AiModelInfo, ModelId } from "../types";

interface AiModelGridProps {
  models: AiModelInfo[];
  selectedModel: AiModelInfo | null;
  onSelect: (m: AiModelInfo | null) => void;
  onReload: (id: string) => void;
  onUnload: (id: string) => void;
}

const MODEL_ICONS: Record<ModelId, typeof BrainCircuit> = {
  yolo: BrainCircuit,
  easyocr: ScanText,
  insightface: UserCheck,
  resnet50: Network,
  decision: Zap,
};

function InferenceGauge({
  count,
  max,
  color,
}: {
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min((count / max) * 100, 100) : 0;
  const radius = 16;
  const stroke = 3;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx="20"
        cy="20"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 20 20)"
        className="transition-all duration-700 ease-out"
      />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[8px] font-bold"
      >
        {pct > 99 ? "99+" : Math.round(pct)}
      </text>
    </svg>
  );
}

function ModelCard({
  model,
  isSelected,
  onSelect,
  onReload,
  onUnload,
  reduced,
  index,
  maxInference,
}: {
  model: AiModelInfo;
  isSelected: boolean;
  onSelect: (m: AiModelInfo | null) => void;
  onReload: (id: string) => void;
  onUnload: (id: string) => void;
  reduced: boolean;
  index: number;
  maxInference: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reloading, setReloading] = useState(false);
  const Icon = MODEL_ICONS[model.id] ?? BrainCircuit;
  const statusColor = STATUS_CONFIG[model.status].hex;

  const handleReload = useCallback(() => {
    setReloading(true);
    onReload(model.id);
    setTimeout(() => setReloading(false), 1200);
  }, [model.id, onReload]);

  return (
    <motion.div
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduced ? 0 : index * 0.07 }}
      layout
    >
      <Card
        className={cn(
          "p-4 cursor-pointer transition-all duration-200",
          isSelected
            ? "ring-2 ring-primary border-primary/40"
            : "hover:border-white/10"
        )}
        onClick={() => onSelect(isSelected ? null : model)}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        aria-label={`${model.name} - ${STATUS_CONFIG[model.status].label}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(isSelected ? null : model);
          }
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-lg p-2"
              style={{ backgroundColor: `${statusColor}15` }}
            >
              <Icon className="h-5 w-5" style={{ color: statusColor }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold">{model.name}</h4>
              <p className="text-xs text-muted-foreground">{model.type}</p>
            </div>
          </div>
          <InferenceGauge
            count={model.inferenceCount}
            max={maxInference}
            color={statusColor}
          />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <StatusPill
            status={model.status === "down" ? "inactive" : model.status}
            label={STATUS_CONFIG[model.status].label}
          />
          <Badge variant={model.loaded ? "success" : "neutral"} size="sm">
            {model.loaded ? "Loaded" : "Unloaded"}
          </Badge>
          <Badge variant="outline" size="sm">v{model.version}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs mb-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Memory</span>
            <span className="font-medium">{model.memoryMb} MB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Latency</span>
            <span className="font-medium">{model.avgLatencyMs}ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Inferences</span>
            <span className="font-medium">{formatInferenceCount(model.inferenceCount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Failures</span>
            <span
              className={cn(
                "font-medium",
                model.failureCount > 0 ? "text-danger" : "text-success"
              )}
            >
              {model.failureCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime</span>
            <span className="font-medium">{formatUptime(model.uptimeMs)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Device</span>
            <span className="font-medium">{model.device}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              handleReload();
            }}
            disabled={reloading}
          >
            <RotateCcw className={cn("h-3 w-3 mr-1", reloading && "animate-spin")} />
            {reloading ? "Reloading..." : "Reload"}
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              onUnload(model.id);
            }}
            disabled={!model.loaded}
          >
            <Power className="h-3 w-3 mr-1" />
            Unload
          </Button>
        </div>

        {isSelected && (
          <div className="mt-3 pt-3 border-t border-border">
            <button
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              aria-expanded={expanded}
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Configuration
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={reduced ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-1">
                    {Object.entries(model.config).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex justify-between text-xs py-0.5"
                      >
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-mono text-foreground">{val}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export function AiModelGrid({
  models,
  selectedModel,
  onSelect,
  onReload,
  onUnload,
}: AiModelGridProps) {
  const reduced = useReducedMotion();

  const maxInference = Math.max(...models.map((m) => m.inferenceCount), 1);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {models.map((model, i) => (
        <ModelCard
          key={model.id}
          model={model}
          isSelected={selectedModel?.id === model.id}
          onSelect={onSelect}
          onReload={onReload}
          onUnload={onUnload}
          reduced={reduced}
          index={i}
          maxInference={maxInference}
        />
      ))}
    </div>
  );
}
