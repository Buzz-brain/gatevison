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
import { cn } from "@/lib/utils";
import { ChartCard, TOOLTIP_STYLE } from "./chart-card";
import { CHART, formatHour } from "../utils";
import type { HourlyTraffic } from "../types";

interface TrafficHourlyChartProps {
  data: HourlyTraffic[];
  isLoading?: boolean;
  isError?: boolean;
}

function TrafficHourlyChartSkeleton() {
  return (
    <ChartCard title="Hourly Traffic" subtitle="Entries and exits by hour">
      <div className="flex h-[300px] items-end gap-1 px-2">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div
              className="w-full animate-pulse rounded-t bg-muted"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
            <div className="h-2 w-6 rounded bg-muted" />
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function TrafficHourlyChartError() {
  return (
    <ChartCard title="Hourly Traffic" subtitle="Entries and exits by hour">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load traffic data.</p>
      </div>
    </ChartCard>
  );
}

function TrafficHourlyChartEmpty() {
  return (
    <ChartCard title="Hourly Traffic" subtitle="Entries and exits by hour">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No traffic data available.</p>
      </div>
    </ChartCard>
  );
}

function TrafficHourlyChartInner({ data }: { data: HourlyTraffic[] }) {
  const reduced = useReducedMotion();

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        hour: formatHour(d.hour),
        Entries: d.entries,
        Exits: d.exits,
      })),
    [data],
  );

  return (
    <ChartCard title="Hourly Traffic" subtitle="Entries and exits by hour">
      <div className={cn("h-[300px]", reduced && "[&_.recharts-area-area]:opacity-100")}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="entriesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="exitsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART.success} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART.success} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis
              dataKey="hour"
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
            <Area
              type="monotone"
              dataKey="Entries"
              stroke={CHART.primary}
              fill="url(#entriesGrad)"
              strokeWidth={2}
              isAnimationActive={!reduced}
            />
            <Area
              type="monotone"
              dataKey="Exits"
              stroke={CHART.success}
              fill="url(#exitsGrad)"
              strokeWidth={2}
              isAnimationActive={!reduced}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function TrafficHourlyChart({ data, isLoading, isError }: TrafficHourlyChartProps) {
  if (isLoading) return <TrafficHourlyChartSkeleton />;
  if (isError) return <TrafficHourlyChartError />;
  if (!data || data.length === 0) return <TrafficHourlyChartEmpty />;
  return <TrafficHourlyChartInner data={data} />;
}
