import { motion } from "framer-motion";
import { BarChart3, Clock, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { PerfMetric } from "../types";

interface PerformanceCenterProps {
  perf: PerfMetric[];
}

function Sparkline({
  points,
  color,
  width = 140,
  height = 32,
}: {
  points: { timestamp: string; value: number }[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (points.length === 0) return null;
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / Math.max(points.length - 1, 1);

  const pathData = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath =
    pathData + ` L ${(values.length - 1) * step} ${height} L 0 ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible"
    >
      <defs>
        <linearGradient id={`pg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#pg-${color.replace("#", "")})`} />
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

function LatencyGraph({
  points,
  reduced,
}: {
  points: { timestamp: string; value: number }[];
  reduced: boolean;
}) {
  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const svgW = 400;
  const svgH = 100;
  const padX = 4;
  const padY = 8;
  const plotW = svgW - padX * 2;
  const plotH = svgH - padY * 2;
  const step = plotW / Math.max(values.length - 1, 1);

  const lineData = values
    .map((v, i) => {
      const x = padX + i * step;
      const y = padY + plotH - ((v - min) / range) * plotH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath =
    lineData +
    ` L ${padX + (values.length - 1) * step} ${svgH} L ${padX} ${svgH} Z`;

  // Y-axis grid lines (4 lines)
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((frac) => {
    const y = padY + plotH * (1 - frac);
    const val = min + range * frac;
    return { y, val };
  });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-foreground">Latency Over Time</span>
        <Badge variant="outline" size="sm">
          {points.length} samples
        </Badge>
      </div>
      <div className="w-full overflow-hidden">
        <svg
          width="100%"
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={padX}
                y1={g.y}
                x2={svgW - padX}
                y2={g.y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
              <text
                x={svgW - padX + 2}
                y={g.y + 3}
                className="text-[8px] fill-muted-foreground"
              >
                {g.val.toFixed(0)}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill="url(#latGrad)"
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />

          {/* Line */}
          <motion.path
            d={lineData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={
              reduced
                ? { pathLength: 1 }
                : { pathLength: 0 }
            }
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Latest value dot */}
          {values.length > 0 && (
            <motion.circle
              cx={padX + (values.length - 1) * step}
              cy={padY + plotH - ((values[values.length - 1]! - min) / range) * plotH}
              r="3"
              fill="#3b82f6"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth="1"
              initial={reduced ? { opacity: 1 } : { opacity: 0, r: 0 }}
              animate={{ opacity: 1, r: 3 }}
              transition={{ duration: 0.4, delay: reduced ? 0 : 0.8 }}
            />
          )}
        </svg>
      </div>
    </Card>
  );
}

function MetricTimingBar({
  metric,
  reduced,
  index,
}: {
  metric: PerfMetric;
  reduced: boolean;
  index: number;
}) {
  const maxVal = Math.max(metric.p99, metric.p95, metric.avg, 1);
  const barWidth = 200;

  const avgW = (metric.avg / maxVal) * barWidth;
  const p95X = (metric.p95 / maxVal) * barWidth;
  const p99X = (metric.p99 / maxVal) * barWidth;

  const color =
    metric.avg <= 50 ? "#22c55e" : metric.avg <= 150 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-medium text-foreground min-w-[80px]">
          {metric.label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold tabular-nums" style={{ color }}>
            {metric.avg.toFixed(1)}
          </span>
          <span className="text-[10px] text-muted-foreground">{metric.unit}</span>
        </div>
        <Sparkline points={metric.trend} color={color} width={80} height={24} />
      </div>

      <div className="flex items-center gap-4 mb-1.5">
        <span className="text-[10px] text-muted-foreground w-24">Avg</span>
        <div className="relative h-3 flex-1 max-w-[200px] rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: color }}
            initial={reduced ? { width: `${avgW}px` } : { width: "0%" }}
            animate={{ width: `${avgW}px` }}
            transition={{
              duration: 0.6,
              delay: reduced ? 0 : index * 0.08,
              ease: "easeOut",
            }}
          />
          {/* P95 marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-warning"
            style={{ left: `${p95X}px` }}
          />
          {/* P99 marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-danger"
            style={{ left: `${p99X}px` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4 pl-24 text-[10px] text-muted-foreground">
        <span>
          P95: <span className="text-warning font-medium tabular-nums">{metric.p95.toFixed(1)}{metric.unit}</span>
        </span>
        <span>
          P99: <span className="text-danger font-medium tabular-nums">{metric.p99.toFixed(1)}{metric.unit}</span>
        </span>
      </div>
    </div>
  );
}

export function PerformanceCenter({ perf }: PerformanceCenterProps) {
  const reduced = useReducedMotion();

  return (
    <Card className="p-6" role="region" aria-label="Performance center">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Performance Center</h3>
        <Badge variant="outline" size="sm">
          {perf.length} metrics
        </Badge>
      </div>

      {/* Pipeline timings */}
      <div className="space-y-5 mb-6">
        {perf.map((metric, i) => (
          <motion.div
            key={metric.id}
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: reduced ? 0 : i * 0.06 }}
            className="rounded-lg border border-border bg-surface p-4"
          >
            <MetricTimingBar metric={metric} reduced={reduced} index={i} />
          </motion.div>
        ))}
      </div>

      {/* Latency graph - use first metric's trend data or combine */}
      <LatencyGraph
        points={
          perf.length > 0
            ? perf[0]!.trend
            : []
        }
        reduced={reduced}
      />
    </Card>
  );
}
