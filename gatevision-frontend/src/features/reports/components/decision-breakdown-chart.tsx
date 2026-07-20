import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type PieLabelRenderProps } from "recharts";
import { ChartCard, TOOLTIP_STYLE } from "./chart-card";
import { CHART, DECISION_CONFIG, formatNumber } from "../utils";
import type { DecisionBreakdown } from "../types";

interface DecisionBreakdownChartProps {
  data: DecisionBreakdown[];
  isLoading?: boolean;
  isError?: boolean;
}

function DecisionBreakdownChartSkeleton() {
  return (
    <ChartCard title="Decision Breakdown" subtitle="Access decision distribution">
      <div className="flex h-[300px] items-center justify-center">
        <div className="h-40 w-40 animate-pulse rounded-full bg-muted" />
      </div>
    </ChartCard>
  );
}

function DecisionBreakdownChartError() {
  return (
    <ChartCard title="Decision Breakdown" subtitle="Access decision distribution">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load decision data.</p>
      </div>
    </ChartCard>
  );
}

function DecisionBreakdownChartEmpty() {
  return (
    <ChartCard title="Decision Breakdown" subtitle="Access decision distribution">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No decision data available.</p>
      </div>
    </ChartCard>
  );
}

function renderCustomLabel(props: PieLabelRenderProps) {
  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const innerRadius = Number(props.innerRadius ?? 0);
  const outerRadius = Number(props.outerRadius ?? 0);
  const percent = Number(props.percent ?? 0);
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function DecisionBreakdownChartInner({ data }: { data: DecisionBreakdown[] }) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        name: DECISION_CONFIG[d.type]?.label ?? d.type,
        value: d.count,
        type: d.type,
      })),
    [data],
  );

  return (
    <ChartCard title="Decision Breakdown" subtitle="Access decision distribution">
      <div className="relative h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={2}
              dataKey="value"
              label={renderCustomLabel}
              labelLine={false}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.type}
                  fill={DECISION_CONFIG[entry.type]?.color ?? CHART.muted}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name) => [
                `${formatNumber(Number(value))} (${total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0}%)`,
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{formatNumber(total)}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {chartData.map((entry) => (
          <div key={entry.type} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: DECISION_CONFIG[entry.type]?.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-medium text-foreground">{formatNumber(entry.value)}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

export function DecisionBreakdownChart({ data, isLoading, isError }: DecisionBreakdownChartProps) {
  if (isLoading) return <DecisionBreakdownChartSkeleton />;
  if (isError) return <DecisionBreakdownChartError />;
  if (!data || data.length === 0) return <DecisionBreakdownChartEmpty />;
  return <DecisionBreakdownChartInner data={data} />;
}
