import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ChartCard, TOOLTIP_STYLE } from "./chart-card";
import { CHART, formatNumber } from "../utils";
import type { ForecastPoint, ForecastSummary } from "../types";

interface ForecastChartProps {
  data: ForecastPoint[];
  summary: ForecastSummary | null;
  isLoading?: boolean;
  isError?: boolean;
}

function ForecastChartSkeleton() {
  return (
    <ChartCard title="Traffic Forecast" subtitle="Predicted traffic with confidence bands">
      <div className="h-[300px] w-full animate-pulse rounded bg-muted/30" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      </div>
    </ChartCard>
  );
}

function ForecastChartError() {
  return (
    <ChartCard title="Traffic Forecast" subtitle="Predicted traffic with confidence bands">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load forecast data.</p>
      </div>
    </ChartCard>
  );
}

function ForecastChartEmpty() {
  return (
    <ChartCard title="Traffic Forecast" subtitle="Predicted traffic with confidence bands">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No forecast data available.</p>
      </div>
    </ChartCard>
  );
}

function ForecastChartInner({ data, summary }: { data: ForecastPoint[]; summary: ForecastSummary | null }) {
  const reduced = useReducedMotion();

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        label: d.label,
        Actual: d.actual,
        Predicted: d.predicted,
        "Confidence Band": [d.lower, d.upper] as [number, number],
        lower: d.lower,
        upper: d.upper,
      })),
    [data],
  );

  const lastActualIndex = useMemo(() => {
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i]!.actual !== null) return i;
    }
    return -1;
  }, [data]);

  return (
    <ChartCard title="Traffic Forecast" subtitle="Predicted traffic with confidence bands">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="forecastConfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.15} />
                <stop offset="95%" stopColor={CHART.primary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ stroke: CHART.border, strokeWidth: 1 }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: 12 }}
            />
            {lastActualIndex >= 0 && (
              <ReferenceLine
                x={data[lastActualIndex]!.label}
                stroke={CHART.muted}
                strokeDasharray="4 4"
                label={{ value: "Now", position: "top", fontSize: 10, fill: CHART.muted }}
              />
            )}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#forecastConfGrad)"
              isAnimationActive={!reduced}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="var(--color-background)"
              isAnimationActive={!reduced}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="Actual"
              stroke={CHART.primary}
              fill="none"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              isAnimationActive={!reduced}
            />
            <Area
              type="monotone"
              dataKey="Predicted"
              stroke={CHART.warning}
              fill="none"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              isAnimationActive={!reduced}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {summary && (
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-muted-foreground">Tomorrow Entries</p>
            <p className="text-sm font-semibold text-foreground">{formatNumber(summary.tomorrowEntries)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Peak Hour</p>
            <p className="text-sm font-semibold text-foreground">{summary.peakHour}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Recognition Workload</p>
            <p className="text-sm font-semibold text-foreground">{formatNumber(summary.recognitionWorkload)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Staff Recommendation</p>
            <p className="text-xs text-foreground">{summary.staffRecommendation}</p>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

export function ForecastChart({ data, summary, isLoading, isError }: ForecastChartProps) {
  if (isLoading) return <ForecastChartSkeleton />;
  if (isError) return <ForecastChartError />;
  if (!data || data.length === 0) return <ForecastChartEmpty />;
  return <ForecastChartInner data={data} summary={summary} />;
}
