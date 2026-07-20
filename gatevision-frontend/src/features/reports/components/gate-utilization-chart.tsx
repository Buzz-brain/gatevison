import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartCard, TOOLTIP_STYLE } from "./chart-card";
import { CHART, formatNumber, formatPct } from "../utils";
import type { GateUtilization } from "../types";

interface GateUtilizationChartProps {
  data: GateUtilization[];
  isLoading?: boolean;
  isError?: boolean;
}

function utilizationColor(pct: number): string {
  if (pct >= 90) return CHART.danger;
  if (pct >= 70) return CHART.warning;
  return CHART.success;
}

function GateUtilizationChartSkeleton() {
  return (
    <ChartCard title="Gate Utilization" subtitle="Per-gate utilization rate">
      <div className="flex h-[300px] items-end gap-4 px-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full animate-pulse rounded-t bg-muted"
              style={{ height: `${30 + Math.random() * 50}%` }}
            />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

function GateUtilizationChartError() {
  return (
    <ChartCard title="Gate Utilization" subtitle="Per-gate utilization rate">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load utilization data.</p>
      </div>
    </ChartCard>
  );
}

function GateUtilizationChartEmpty() {
  return (
    <ChartCard title="Gate Utilization" subtitle="Per-gate utilization rate">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No utilization data available.</p>
      </div>
    </ChartCard>
  );
}

interface UtilizationTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      gateName: string;
      utilizationPct: number;
      entries: number;
      avgWaitSec: number;
    };
  }>;
}

function UtilizationTooltip({ active, payload }: UtilizationTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]!.payload;

  return (
    <div style={TOOLTIP_STYLE} className="space-y-1">
      <p className="font-semibold text-foreground">{item.gateName}</p>
      <p className="text-xs text-muted-foreground">
        Utilization: <span className="font-medium text-foreground">{formatPct(item.utilizationPct)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Entries: <span className="font-medium text-foreground">{formatNumber(item.entries)}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Avg Wait: <span className="font-medium text-foreground">{item.avgWaitSec.toFixed(1)}s</span>
      </p>
    </div>
  );
}

function GateUtilizationChartInner({ data }: { data: GateUtilization[] }) {
  const avgEntries = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.entries, 0) / data.length;
  }, [data]);

  return (
    <ChartCard title="Gate Utilization" subtitle="Per-gate utilization rate">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis
              dataKey="gateName"
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
            />
            <YAxis
              yAxisId="pct"
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              yAxisId="count"
              orientation="right"
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<UtilizationTooltip />} cursor={{ fill: CHART.grid }} />
            <ReferenceLine
              yAxisId="count"
              y={avgEntries}
              stroke={CHART.primary}
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{ value: "Avg", position: "right", fontSize: 10, fill: CHART.primary }}
            />
            <Bar yAxisId="pct" dataKey="utilizationPct" radius={[4, 4, 0, 0]} barSize={28}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={utilizationColor(entry.utilizationPct)}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function GateUtilizationChart({ data, isLoading, isError }: GateUtilizationChartProps) {
  if (isLoading) return <GateUtilizationChartSkeleton />;
  if (isError) return <GateUtilizationChartError />;
  if (!data || data.length === 0) return <GateUtilizationChartEmpty />;
  return <GateUtilizationChartInner data={data} />;
}
