import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { STATUS_CONFIG } from "../utils";
import type { PipelineStatus } from "../types";

interface PipelineFlowMapProps {
  pipeline: PipelineStatus;
}

function FlowNode({
  name,
  avgTimeMs,
  status,
  isBottleneck,
  index,
  total,
  reduced,
}: {
  name: string;
  avgTimeMs: number;
  status: string;
  isBottleneck: boolean;
  index: number;
  total: number;
  reduced: boolean;
}) {
  const color = isBottleneck ? "#f59e0b" : STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.hex ?? "#3b82f6";

  return (
    <motion.div
      initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: reduced ? 0 : index * 0.08 }}
      className={cn(
        "flex flex-col items-center gap-1 relative z-10"
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-xl border-2 px-3 py-2 transition-all",
          isBottleneck ? "border-warning bg-warning/10" : "border-border bg-surface"
        )}
        style={{
          boxShadow: `0 0 20px ${color}20`,
          minWidth: "100px",
        }}
      >
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full border-2 border-background"
          style={{ backgroundColor: color }}
        />
        <div className="text-center">
          <p className="text-xs font-medium text-foreground leading-tight">{name}</p>
          <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5">
            {avgTimeMs.toFixed(0)}ms avg
          </p>
        </div>
        {isBottleneck && (
          <div className="absolute -top-2 -right-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function FlowLine({
  index,
  reduced,
  color,
}: {
  index: number;
  reduced: boolean;
  color: string;
}) {
  return (
    <div className="flex items-center flex-1 min-w-[20px] relative">
      <svg
        className="w-full h-6 overflow-visible"
        viewBox="0 0 100 24"
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="12"
          x2="100"
          y2="12"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <line
          x1="0"
          y1="12"
          x2="100"
          y2="12"
          stroke={color}
          strokeWidth="2"
          strokeDasharray="4 4"
          opacity="0.5"
        />
        {!reduced && (
          <motion.circle
            r="3"
            fill={color}
            opacity="0.8"
            initial={{ cx: 0 }}
            animate={{ cx: 100 }}
            transition={{
              duration: 1.8,
              delay: index * 0.3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        )}
      </svg>
    </div>
  );
}

function ParticleDot({
  pathIndex,
  reduced,
  color,
}: {
  pathIndex: number;
  reduced: boolean;
  color: string;
}) {
  if (reduced) return null;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 4,
        height: 4,
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}`,
        top: "50%",
        marginTop: -2,
      }}
      initial={{ left: "0%", opacity: 0 }}
      animate={{
        left: ["0%", "100%"],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: 2,
        delay: pathIndex * 0.4 + Math.random() * 0.5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

export function PipelineFlowMap({ pipeline }: PipelineFlowMapProps) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const stages = pipeline.stages;
  const totalCapacity = Math.max(
    pipeline.currentRequests + pipeline.queueSize + pipeline.dropped,
    1
  );
  const queuePct = (pipeline.queueSize / totalCapacity) * 100;

  return (
    <Card className="p-6" role="region" aria-label="Pipeline flow map">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-sm font-medium">Pipeline Flow</h3>
        {pipeline.bottleneck && (
          <Badge variant="warning" size="sm">
            <AlertTriangle className="h-3 w-3 mr-0.5" />
            Bottleneck: {pipeline.bottleneck}
          </Badge>
        )}
      </div>

      <div ref={containerRef} className="relative mb-6">
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center flex-shrink-0">
              {i > 0 && (
                <FlowLine
                  index={i - 1}
                  reduced={reduced}
                  color={STATUS_CONFIG[stage.status]?.hex ?? "#3b82f6"}
                />
              )}
              <FlowNode
                name={stage.name}
                avgTimeMs={stage.avgTimeMs}
                status={stage.status}
                isBottleneck={pipeline.bottleneck === stage.id}
                index={i}
                total={stages.length}
                reduced={reduced}
              />
            </div>
          ))}
        </div>

        {/* Floating particles layer */}
        {!reduced && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {stages.slice(0, -1).map((stage, i) => (
              <ParticleDot
                key={`particle-${stage.id}`}
                pathIndex={i}
                reduced={reduced}
                color={STATUS_CONFIG[stage.status]?.hex ?? "#3b82f6"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom stats bar */}
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Current Requests</span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {pipeline.currentRequests}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">Queue Size</span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {pipeline.queueSize}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-danger" />
            <span className="text-xs text-muted-foreground">Dropped</span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {pipeline.dropped}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Total Latency</span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {pipeline.totalLatencyMs.toFixed(0)}ms
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Queue Fill</span>
            <span className="text-[10px] tabular-nums text-foreground">{queuePct.toFixed(0)}%</span>
          </div>
          <motion.div
            className="h-2 w-full rounded-full bg-white/5 overflow-hidden"
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="h-full rounded-full bg-warning"
              initial={reduced ? { width: `${queuePct}%` } : { width: "0%" }}
              animate={{ width: `${queuePct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </motion.div>
        </div>
      </div>
    </Card>
  );
}
