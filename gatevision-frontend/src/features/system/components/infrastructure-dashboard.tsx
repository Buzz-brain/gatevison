import { useEffect, useState } from "react";
import { motion, animate } from "framer-motion";
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Thermometer,
  Wifi,
  Activity,
  Layers,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getMetricColor } from "../utils";
import type { InfrastructureMetric, MetricId } from "../types";

interface InfrastructureDashboardProps {
  metrics: InfrastructureMetric[];
}

const METRIC_ICONS: Record<MetricId, typeof Cpu> = {
  cpu: Cpu,
  memory: MemoryStick,
  disk: HardDrive,
  gpu: Layers,
  network: Wifi,
  processes: Activity,
  threads: Workflow,
  temperature: Thermometer,
};

function Sparkline({
  points,
  color,
  width = 80,
  height = 28,
}: {
  points: { value: number }[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value), 0);
  const range = max - min || 1;
  const step = width / Math.max(points.length - 1, 1);

  const pathData = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p.value - min) / range) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath =
    pathData +
    ` L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={areaPath}
        fill={`url(#grad-${color.replace("#", "")})`}
      />
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CountUpValue({
  value,
  unit,
  decimals = 0,
  reduced,
}: {
  value: number;
  unit: string;
  decimals?: number;
  reduced: boolean;
}) {
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [value, reduced]);

  return (
    <span className="text-2xl font-bold tabular-nums">
      {display.toFixed(decimals)}
      <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
    </span>
  );
}

function MetricCard({
  metric,
  reduced,
  index,
}: {
  metric: InfrastructureMetric;
  reduced: boolean;
  index: number;
}) {
  const Icon = METRIC_ICONS[metric.id] ?? Activity;
  const color = getMetricColor(metric.id, metric.current);

  return (
    <motion.div
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduced ? 0 : index * 0.06 }}
    >
      <Card className="p-4 h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-lg p-1.5"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <span className="text-sm font-medium">{metric.label}</span>
          </div>
          <Sparkline points={metric.trend} color={color} />
        </div>

        <CountUpValue
          value={metric.current}
          unit={metric.unit}
          decimals={metric.id === "temperature" ? 1 : 0}
          reduced={reduced}
        />

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Peak: <span className="text-foreground font-medium">{metric.peak}{metric.unit}</span>
          </span>
          <span>
            Avg: <span className="text-foreground font-medium">{metric.average}{metric.unit}</span>
          </span>
        </div>

        <div className="mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={reduced ? { width: `${Math.min(metric.current, 100)}%` } : { width: "0%" }}
            animate={{ width: `${Math.min(metric.current, 100)}%` }}
            transition={{ duration: 0.8, delay: reduced ? 0 : index * 0.06 + 0.2, ease: "easeOut" }}
          />
        </div>
      </Card>
    </motion.div>
  );
}

export function InfrastructureDashboard({ metrics }: InfrastructureDashboardProps) {
  const reduced = useReducedMotion();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, i) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          reduced={reduced}
          index={i}
        />
      ))}
    </div>
  );
}
