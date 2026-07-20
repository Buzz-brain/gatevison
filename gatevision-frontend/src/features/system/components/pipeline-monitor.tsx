import { motion } from "framer-motion";
import { AlertTriangle, Gauge, Users, Droplets, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { STATUS_CONFIG } from "../utils";
import type { PipelineStatus, PipelineStageInfo } from "../types";

interface PipelineMonitorProps {
  pipeline: PipelineStatus;
}

function StageRow({
  stage,
  maxAvg,
  isBottleneck,
  reduced,
  index,
}: {
  stage: PipelineStageInfo;
  maxAvg: number;
  isBottleneck: boolean;
  reduced: boolean;
  index: number;
}) {
  const color = STATUS_CONFIG[stage.status].hex;
  const barPct = maxAvg > 0 ? (stage.avgTimeMs / maxAvg) * 100 : 0;

  return (
    <motion.div
      initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: reduced ? 0 : index * 0.06 }}
      className={cn(
        "rounded-lg border p-3 transition-colors",
        isBottleneck
          ? "border-warning/30 bg-warning/5"
          : "border-border bg-surface"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium">{stage.name}</span>
          {isBottleneck && (
            <Badge variant="warning" size="sm">
              <AlertTriangle className="h-3 w-3 mr-0.5" />
              Bottleneck
            </Badge>
          )}
        </div>
        <Badge
          variant={
            stage.successPct >= 99
              ? "success"
              : stage.successPct >= 95
                ? "warning"
                : "danger"
          }
          size="sm"
        >
          {stage.successPct.toFixed(1)}%
        </Badge>
      </div>

      <div className="relative h-3 w-full rounded-full bg-white/5 overflow-hidden mb-2">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            backgroundColor: isBottleneck ? "#f59e0b" : "#3b82f6",
          }}
          initial={reduced ? { width: `${barPct}%` } : { width: "0%" }}
          animate={{ width: `${barPct}%` }}
          transition={{
            duration: 0.6,
            delay: reduced ? 0 : index * 0.06 + 0.1,
            ease: "easeOut",
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            Avg: <span className="text-foreground font-medium tabular-nums">{stage.avgTimeMs.toFixed(0)}ms</span>
          </span>
          <span>
            Fast: <span className="text-success font-medium tabular-nums">{stage.fastestMs.toFixed(0)}ms</span>
          </span>
          <span>
            Slow: <span className="text-danger font-medium tabular-nums">{stage.slowestMs.toFixed(0)}ms</span>
          </span>
        </div>
        {stage.failures > 0 && (
          <Badge variant="danger" size="sm">
            {stage.failures} {stage.failures === 1 ? "failure" : "failures"}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}

function TopBar({
  pipeline,
  reduced,
}: {
  pipeline: PipelineStatus;
  reduced: boolean;
}) {
  const totalCapacity = Math.max(
    pipeline.currentRequests + pipeline.queueSize + pipeline.dropped,
    1
  );
  const reqPct = (pipeline.currentRequests / totalCapacity) * 100;
  const queuePct = (pipeline.queueSize / totalCapacity) * 100;
  const droppedPct = (pipeline.dropped / totalCapacity) * 100;

  return (
    <Card className="p-4 mb-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Active</span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {pipeline.currentRequests}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-warning" />
          <span className="text-xs text-muted-foreground">Queue</span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {pipeline.queueSize}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-danger" />
          <span className="text-xs text-muted-foreground">Dropped</span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {pipeline.dropped}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Total Latency</span>
          <span className="text-sm font-bold tabular-nums text-foreground">
            {pipeline.totalLatencyMs.toFixed(0)}ms
          </span>
        </div>
      </div>

      <div className="mt-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-l-full bg-primary"
          initial={reduced ? { width: `${reqPct}%` } : { width: "0%" }}
          animate={{ width: `${reqPct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        <motion.div
          className="h-full bg-warning"
          initial={reduced ? { width: `${queuePct}%` } : { width: "0%" }}
          animate={{ width: `${queuePct}%` }}
          transition={{ duration: 0.5, delay: reduced ? 0 : 0.1, ease: "easeOut" }}
        />
        <motion.div
          className="h-full rounded-r-full bg-danger"
          initial={reduced ? { width: `${droppedPct}%` } : { width: "0%" }}
          animate={{ width: `${droppedPct}%` }}
          transition={{ duration: 0.5, delay: reduced ? 0 : 0.2, ease: "easeOut" }}
        />
      </div>

      <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Active ({reqPct.toFixed(0)}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
          Queued ({queuePct.toFixed(0)}%)
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" />
          Dropped ({droppedPct.toFixed(0)}%)
        </span>
      </div>
    </Card>
  );
}

export function PipelineMonitor({ pipeline }: PipelineMonitorProps) {
  const reduced = useReducedMotion();

  const maxAvg = Math.max(
    ...pipeline.stages.map((s) => s.avgTimeMs),
    1
  );

  return (
    <div>
      <TopBar pipeline={pipeline} reduced={reduced} />

      <div className="space-y-2">
        {pipeline.stages.map((stage, i) => (
          <StageRow
            key={stage.id}
            stage={stage}
            maxAvg={maxAvg}
            isBottleneck={pipeline.bottleneck === stage.id}
            reduced={reduced}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
