import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Car, Ban, Users, AlertTriangle, Activity, Clock, TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateMetricsTick, formatNumber } from "../utils";
import type { MetricsSnapshot } from "../types";

interface LiveChartProps {
  data: number[];
  color: string;
  height?: number;
}

function SparklineChart({ data, color, height = 40 }: LiveChartProps) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-full">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-80"
      />
    </svg>
  );
}

function MetricCard({ label, value, unit, icon: Icon, trend, color, formatter = formatNumber }: {
  label: string;
  value: number;
  unit?: string;
  icon: typeof Car;
  trend: "up" | "down" | "stable";
  color: string;
  formatter?: (n: number) => string;
}) {
  const TrendIcon = trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;
  const trendColor = trend === "up" ? "text-success" : trend === "down" ? "text-danger" : "text-muted-foreground";

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${color.replace("text", "bg").replace("success", "success/15").replace("danger", "danger/15").replace("warning", "warning/15").replace("info", "info/15").replace("primary", "primary/15")}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <motion.div
          key={value}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1"
        >
          <TrendIcon className={`h-3 w-3 ${trendColor}`} />
        </motion.div>
      </div>
      <motion.p
        key={value}
        initial={{ y: -5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`text-2xl font-bold font-mono ${color}`}
      >
        {formatter(value)}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </motion.p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </Card>
  );
}

export function LiveMetricsSimulation() {
  const prefersReduced = useReducedMotion();
  const [history, setHistory] = useState<MetricsSnapshot[]>(() => {
    const arr: MetricsSnapshot[] = [];
    let last: MetricsSnapshot = { entries: 0, exits: 0, denied: 0, manualReviews: 0, incidents: 0, avgProcessingTime: 400, throughput: 4, timestamp: new Date().toISOString() };
    for (let i = 0; i < 30; i++) {
      const tick = generateMetricsTick(last);
      arr.push(tick);
      last = tick;
    }
    return arr;
  });
  const latest = history[history.length - 1]!;

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1]!;
        return [...prev.slice(-29), generateMetricsTick(last)];
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const entriesHistory = history.map((h) => h.entries);
  const deniedHistory = history.map((h) => h.denied);
  const latencyHistory = history.map((h) => h.avgProcessingTime);

  const entryTrend = entriesHistory.length > 2
    ? entriesHistory[entriesHistory.length - 1]! > entriesHistory[entriesHistory.length - 3]! ? "up" as const
      : entriesHistory[entriesHistory.length - 1]! < entriesHistory[entriesHistory.length - 3]! ? "down" as const : "stable" as const
    : "stable" as const;

  const deniedTrend = deniedHistory.length > 2
    ? deniedHistory[deniedHistory.length - 1]! > deniedHistory[deniedHistory.length - 3]! ? "up" as const : "down" as const
    : "stable" as const;

  const latencyTrend = latencyHistory.length > 2
    ? latencyHistory[latencyHistory.length - 1]! < latencyHistory[latencyHistory.length - 3]! ? "up" as const : "down" as const
    : "stable" as const;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Real-time simulated metrics with live-updating charts and counters.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Total Entries" value={latest.entries} icon={Car} trend={entryTrend} color="text-success" />
        <MetricCard label="Total Exits" value={latest.exits} icon={Car} trend={entryTrend === "up" ? "down" : "up"} color="text-info" />
        <MetricCard label="Denied" value={latest.denied} icon={Ban} trend={deniedTrend} color="text-danger" />
        <MetricCard label="Manual Reviews" value={latest.manualReviews} icon={Users} trend="stable" color="text-warning" />
        <MetricCard label="Incidents" value={latest.incidents} icon={AlertTriangle} trend={deniedTrend} color="text-danger" />
        <MetricCard label="Processing" value={latest.avgProcessingTime} unit="ms" icon={Clock} trend={latencyTrend} color="text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Entries sparkline */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Entry Volume</h3>
            <Badge variant="success" className="text-[10px]">Live</Badge>
          </div>
          <div className="h-20">
            <SparklineChart data={entriesHistory} color="#22c55e" height={60} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>30 ticks ago</span>
            <span>Now</span>
          </div>
        </Card>

        {/* Processing latency */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">Processing Latency</h3>
            <Badge variant="info" className="text-[10px]">ms</Badge>
          </div>
          <div className="h-20">
            <SparklineChart data={latencyHistory} color="#3b82f6" height={60} />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>30 ticks ago</span>
            <span>Now</span>
          </div>
        </Card>
      </div>

      {/* Histogram bars */}
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-3">Traffic Distribution (last 30 ticks)</h3>
        <div className="flex items-end gap-0.5 h-24">
          {history.map((h, i) => {
            const maxVal = Math.max(...history.map((x) => x.entries + x.exits));
            const hPct = maxVal > 0 ? ((h.entries + h.exits) / maxVal) * 100 : 0;
            const isLatest = i === history.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                <motion.div
                  initial={false}
                  animate={{ height: `${Math.max(hPct, 2)}%` }}
                  className={`w-full rounded-t-sm transition-colors ${
                    isLatest ? "bg-primary" : "bg-primary/30"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Throughput gauge */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Current Throughput</h3>
          <span className="text-2xl font-bold font-mono text-success">{latest.throughput} <span className="text-sm font-normal text-muted-foreground">veh/min</span></span>
        </div>
        <div className="h-3 rounded-full bg-border overflow-hidden">
          <motion.div
            key={latest.throughput}
            initial={{ width: 0 }}
            animate={{ width: `${(latest.throughput / 20) * 100}%` }}
            className="h-full rounded-full bg-gradient-to-r from-success via-warning to-danger"
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>0</span>
          <span>10</span>
          <span>20 veh/min</span>
        </div>
      </Card>
    </div>
  );
}
