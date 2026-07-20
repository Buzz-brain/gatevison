import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChartCard } from "./chart-card";
import { formatNumber, formatPct, CHART } from "../utils";
import type { AiModel } from "../types";

interface ModelsStatusProps {
  data: AiModel[];
  isLoading?: boolean;
  isError?: boolean;
}

function statusColor(status: AiModel["status"]): string {
  switch (status) {
    case "healthy":
      return CHART.success;
    case "degraded":
      return CHART.warning;
    case "down":
      return CHART.danger;
  }
}

function statusVariant(status: AiModel["status"]): "success" | "warning" | "danger" {
  switch (status) {
    case "healthy":
      return "success";
    case "degraded":
      return "warning";
    case "down":
      return "danger";
  }
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 20;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ModelSkeleton() {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    </Card>
  );
}

function ModelsStatusSkeleton() {
  return (
    <ChartCard title="AI Models" subtitle="Model health and performance">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <ModelSkeleton key={i} />
        ))}
      </div>
    </ChartCard>
  );
}

function ModelsStatusError() {
  return (
    <ChartCard title="AI Models" subtitle="Model health and performance">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load model status.</p>
      </div>
    </ChartCard>
  );
}

function ModelsStatusEmpty() {
  return (
    <ChartCard title="AI Models" subtitle="Model health and performance">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No model data available.</p>
      </div>
    </ChartCard>
  );
}

function ModelCard({ model }: { model: AiModel }) {
  const latencyColor =
    model.avgLatencyMs < 50
      ? CHART.success
      : model.avgLatencyMs < 100
        ? CHART.primary
        : model.avgLatencyMs < 200
          ? CHART.warning
          : CHART.danger;

  return (
    <Card className="p-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              {model.status === "healthy" && (
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: statusColor(model.status) }}
                />
              )}
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: statusColor(model.status) }}
              />
            </span>
            <p className="truncate text-sm font-medium text-foreground">{model.name}</p>
          </div>
          <Badge variant={statusVariant(model.status)} size="sm">
            {model.status}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">{model.type} v{model.version}</p>
        <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[11px]">
          <div>
            <p className="text-muted-foreground">Inferences</p>
            <p className="font-medium text-foreground">{formatNumber(model.inferences)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Latency</p>
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-foreground">{model.avgLatencyMs}ms</p>
              <MiniSparkline data={model.latencyTrend} color={latencyColor} />
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Success</p>
            <p className="font-medium text-foreground">{formatPct(model.successRate)}</p>
          </div>
        </div>
        <div className="flex gap-3 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Mem:</span>
            <span className="font-medium text-foreground">{model.memoryMb}MB</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">GPU:</span>
            <span className="font-medium text-foreground">{formatPct(model.gpuPct)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ModelsStatus({ data, isLoading, isError }: ModelsStatusProps) {
  if (isLoading) return <ModelsStatusSkeleton />;
  if (isError) return <ModelsStatusError />;
  if (!data || data.length === 0) return <ModelsStatusEmpty />;

  return (
    <ChartCard title="AI Models" subtitle="Model health and performance">
      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </ChartCard>
  );
}
