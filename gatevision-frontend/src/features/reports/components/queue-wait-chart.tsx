import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard, TOOLTIP_STYLE } from "./chart-card";
import { CHART, formatHour } from "../utils";
import type { QueuePoint, WaitTimePoint } from "../types";

interface QueueWaitChartProps {
  queue: QueuePoint[];
  wait: WaitTimePoint[];
  isLoading?: boolean;
  isError?: boolean;
}

function QueueWaitChartSkeleton() {
  return (
    <ChartCard title="Queue & Wait Time" subtitle="24-hour queue and wait trends">
      <div className="h-[300px] w-full animate-pulse rounded bg-muted/30" />
    </ChartCard>
  );
}

function QueueWaitChartError() {
  return (
    <ChartCard title="Queue & Wait Time" subtitle="24-hour queue and wait trends">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load queue data.</p>
      </div>
    </ChartCard>
  );
}

function QueueWaitChartEmpty() {
  return (
    <ChartCard title="Queue & Wait Time" subtitle="24-hour queue and wait trends">
      <div className="flex h-[300px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No queue data available.</p>
      </div>
    </ChartCard>
  );
}

function QueueWaitChartInner({ queue, wait }: { queue: QueuePoint[]; wait: WaitTimePoint[] }) {
  const chartData = useMemo(() => {
    const waitMap = new Map<number, number>();
    for (const w of wait) {
      waitMap.set(w.hour, w.avgWaitSec);
    }
    return queue.map((q) => ({
      hour: formatHour(q.hour),
      "Queue Length": q.queue,
      "Wait Time (s)": waitMap.get(q.hour) ?? 0,
    }));
  }, [queue, wait]);

  return (
    <ChartCard title="Queue & Wait Time" subtitle="24-hour queue and wait trends">
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
            />
            <YAxis
              yAxisId="queue"
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
              allowDecimals={false}
              label={{ value: "Queue", angle: -90, position: "insideLeft", fontSize: 11, fill: CHART.muted }}
            />
            <YAxis
              yAxisId="wait"
              orientation="right"
              tick={{ fontSize: 11, fill: CHART.muted }}
              axisLine={{ stroke: CHART.grid }}
              tickLine={false}
              label={{ value: "Seconds", angle: 90, position: "insideRight", fontSize: 11, fill: CHART.muted }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: CHART.grid }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar
              yAxisId="queue"
              dataKey="Queue Length"
              fill={CHART.primary}
              fillOpacity={0.6}
              radius={[3, 3, 0, 0]}
              barSize={16}
            />
            <Line
              yAxisId="wait"
              type="monotone"
              dataKey="Wait Time (s)"
              stroke={CHART.warning}
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function QueueWaitChart({ queue, wait, isLoading, isError }: QueueWaitChartProps) {
  if (isLoading) return <QueueWaitChartSkeleton />;
  if (isError) return <QueueWaitChartError />;
  if (!queue || queue.length === 0) return <QueueWaitChartEmpty />;
  return <QueueWaitChartInner queue={queue} wait={wait} />;
}
