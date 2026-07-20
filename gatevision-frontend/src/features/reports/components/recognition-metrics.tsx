import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";
import { CHART, formatNumber } from "../utils";
import type { RecognitionMetric } from "../types";

interface RecognitionMetricsProps {
  data: RecognitionMetric[];
  isLoading?: boolean;
  isError?: boolean;
}

function accuracyColor(pct: number): string {
  if (pct >= 95) return CHART.success;
  if (pct >= 85) return CHART.primary;
  if (pct >= 70) return CHART.warning;
  return CHART.danger;
}

function accuracyVariant(pct: number): "success" | "warning" | "danger" | "info" {
  if (pct >= 95) return "success";
  if (pct >= 85) return "info";
  if (pct >= 70) return "warning";
  return "danger";
}

function MetricSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}

function RecognitionMetricsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <MetricSkeleton key={i} />
      ))}
    </div>
  );
}

function RecognitionMetricsError() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load recognition metrics.</p>
      </div>
    </Card>
  );
}

function RecognitionMetricsEmpty() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No recognition data available.</p>
      </div>
    </Card>
  );
}

function RecognitionMetricCard({ metric }: { metric: RecognitionMetric }) {
  const color = accuracyColor(metric.accuracyPct);
  const variant = accuracyVariant(metric.accuracyPct);
  const isPositive = metric.changePct > 0;

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold" style={{ color }}>
            <CountUp value={metric.accuracyPct} decimals={1} suffix="%" />
          </span>
          <Badge variant={variant} size="sm">
            {isPositive ? "+" : ""}{metric.changePct.toFixed(1)}%
          </Badge>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${metric.accuracyPct}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {formatNumber(metric.samples)} samples
        </p>
      </div>
    </Card>
  );
}

export function RecognitionMetrics({ data, isLoading, isError }: RecognitionMetricsProps) {
  if (isLoading) return <RecognitionMetricsSkeleton />;
  if (isError) return <RecognitionMetricsError />;
  if (!data || data.length === 0) return <RecognitionMetricsEmpty />;

  return (
    <div className="grid grid-cols-2 gap-3">
      {data.map((metric) => (
        <RecognitionMetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
