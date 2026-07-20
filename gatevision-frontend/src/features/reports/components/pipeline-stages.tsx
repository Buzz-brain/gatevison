import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartCard, TOOLTIP_STYLE } from "./chart-card";
import { CHART, formatNumber, formatPct } from "../utils";
import type { PipelineStage } from "../types";

interface PipelineStagesProps {
  data: PipelineStage[];
  isLoading?: boolean;
  isError?: boolean;
}

function successRateColor(rate: number): string {
  if (rate >= 98) return CHART.success;
  if (rate >= 90) return CHART.primary;
  if (rate >= 75) return CHART.warning;
  return CHART.danger;
}

function PipelineStagesSkeleton() {
  return (
    <ChartCard title="Pipeline Stages" subtitle="Processing stage performance">
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-6 flex-1 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function PipelineStagesError() {
  return (
    <ChartCard title="Pipeline Stages" subtitle="Processing stage performance">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load pipeline data.</p>
      </div>
    </ChartCard>
  );
}

function PipelineStagesEmpty() {
  return (
    <ChartCard title="Pipeline Stages" subtitle="Processing stage performance">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No pipeline data available.</p>
      </div>
    </ChartCard>
  );
}

interface PipelineTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      stage: string;
      avgTimeMs: number;
      successRate: number;
      count: number;
    };
  }>;
}

function PipelineTooltip({ active, payload }: PipelineTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]!.payload;

  return (
    <div style={TOOLTIP_STYLE} className="space-y-1">
      <p className="font-semibold text-foreground">{item.stage}</p>
      <p className="text-xs text-muted-foreground">
        Avg Time: <span className="font-medium text-foreground">{formatNumber(item.avgTimeMs)} ms</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Success Rate: <span className="font-medium text-foreground">{formatPct(item.successRate)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Count: <span className="font-medium text-foreground">{formatNumber(item.count)}</span>
      </p>
    </div>
  );
}

function PipelineStagesInner({ data }: { data: PipelineStage[] }) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        stage: d.stage,
        avgTimeMs: d.avgTimeMs,
        successRate: d.successRate,
        count: d.count,
      })),
    [data],
  );

  return (
    <ChartCard title="Pipeline Stages" subtitle="Processing stage performance">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
              tickFormatter={(v: number) => `${v}ms`}
            />
            <YAxis
              type="category"
              dataKey="stage"
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
              width={75}
            />
            <Tooltip content={<PipelineTooltip />} cursor={{ fill: CHART.grid }} />
            <Bar dataKey="avgTimeMs" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={successRateColor(entry.successRate)}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function PipelineStages({ data, isLoading, isError }: PipelineStagesProps) {
  if (isLoading) return <PipelineStagesSkeleton />;
  if (isError) return <PipelineStagesError />;
  if (!data || data.length === 0) return <PipelineStagesEmpty />;
  return <PipelineStagesInner data={data} />;
}
