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
} from "recharts";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ChartCard, TOOLTIP_STYLE } from "./chart-card";
import { CHART } from "../utils";
import type { DailyTrend } from "../types";

interface DailyTrendChartProps {
  data: DailyTrend[];
  isLoading?: boolean;
  isError?: boolean;
}

function DailyTrendChartSkeleton() {
  return (
    <ChartCard title="Daily Trend" subtitle="Entries and exits over 30 days">
      <div className="h-[300px] w-full animate-pulse rounded bg-muted/30" />
    </ChartCard>
  );
}

function DailyTrendChartError() {
  return (
    <ChartCard title="Daily Trend" subtitle="Entries and exits over 30 days">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load trend data.</p>
      </div>
    </ChartCard>
  );
}

function DailyTrendChartEmpty() {
  return (
    <ChartCard title="Daily Trend" subtitle="Entries and exits over 30 days">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No trend data available.</p>
      </div>
    </ChartCard>
  );
}

function DailyTrendChartInner({ data }: { data: DailyTrend[] }) {
  const reduced = useReducedMotion();

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        date: d.date,
        Entries: d.entries,
        Exits: d.exits,
      })),
    [data],
  );

  return (
    <ChartCard title="Daily Trend" subtitle="Entries and exits over 30 days">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="dailyEntriesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.4} />
                <stop offset="95%" stopColor={CHART.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="dailyExitsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART.success} stopOpacity={0.4} />
                <stop offset="95%" stopColor={CHART.success} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
              tickFormatter={(v: string) => {
                const parts = v.split("-");
                return `${parts[1]}/${parts[2]}`;
              }}
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
              labelFormatter={(l) => `Date: ${String(l)}`}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Area
              type="monotone"
              dataKey="Entries"
              stroke={CHART.primary}
              fill="url(#dailyEntriesGrad)"
              strokeWidth={2}
              isAnimationActive={!reduced}
            />
            <Area
              type="monotone"
              dataKey="Exits"
              stroke={CHART.success}
              fill="url(#dailyExitsGrad)"
              strokeWidth={2}
              isAnimationActive={!reduced}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function DailyTrendChart({ data, isLoading, isError }: DailyTrendChartProps) {
  if (isLoading) return <DailyTrendChartSkeleton />;
  if (isError) return <DailyTrendChartError />;
  if (!data || data.length === 0) return <DailyTrendChartEmpty />;
  return <DailyTrendChartInner data={data} />;
}
