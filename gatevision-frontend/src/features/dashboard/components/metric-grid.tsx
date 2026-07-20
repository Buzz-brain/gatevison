import { useEffect, useState, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Car, LogIn, LogOut, XCircle, UserCheck, Clock, Target, Activity, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardMetrics } from "../hooks/use-dashboard-api";
import type { DashboardMetrics } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface MetricCardItem {
  key: keyof DashboardMetrics;
  label: string;
  icon: typeof Car;
  format: (v: any) => string;
}

const METRICS: MetricCardItem[] = [
  { key: "vehiclesProcessed", label: "Vehicles Processed", icon: Car, format: (v) => (v ?? 0).toLocaleString() },
  { key: "entries", label: "Entries", icon: LogIn, format: (v) => (v ?? 0).toLocaleString() },
  { key: "exits", label: "Exits", icon: LogOut, format: (v) => (v ?? 0).toLocaleString() },
  { key: "denied", label: "Denied", icon: XCircle, format: (v) => (v ?? 0).toLocaleString() },
  { key: "manualReviews", label: "Manual Reviews", icon: UserCheck, format: (v) => (v ?? 0).toLocaleString() },
  { key: "avgProcessingTime", label: "Avg Processing", icon: Clock, format: (v) => `${v ?? 0}ms` },
  { key: "recognitionAccuracy", label: "Recognition Accuracy", icon: Target, format: (v) => `${(v ?? 0).toFixed(1)}%` },
  { key: "peakHour", label: "Peak Hour", icon: Activity, format: (v) => String(v ?? "-") },
];

function useCountUp(target: number | string, duration: number, enabled: boolean): string {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  const numTarget = typeof target === "number" ? target : 0;

  useEffect(() => {
    if (!enabled || numTarget === 0) { setCount(numTarget); return; }
    const start = performance.now();
    const initial = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(initial + (numTarget - initial) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [numTarget, duration, enabled]);

  if (typeof target === "string") return target;
  return numTarget.toString();
}

function MetricGrid() {
  const [visible, setVisible] = useState(false);
  const { data: metrics, isLoading, isError, refetch } = useDashboardMetrics();
  const prefersReduced = useReducedMotion();

  useEffect(() => { setVisible(true); }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-elevated border border-border p-4 animate-pulse">
            <div className="h-3 w-20 bg-muted rounded mb-3" />
            <div className="h-6 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-xs text-muted-foreground">Failed to load metrics</p>
        <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {METRICS.map((metric, i) => {
        const rawValue = metrics ? metrics[metric.key] : 0;
        const Icon = metric.icon;
        const isDenied = metric.key === "denied";
        const isManual = metric.key === "manualReviews";
        const isAccuracy = metric.key === "recognitionAccuracy";

        return (
          <motion.div
            key={metric.key}
            initial={prefersReduced ? undefined : { opacity: 0, y: 12 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            className="rounded-xl bg-elevated border border-border p-4 hover:border-primary/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {metric.label}
              </span>
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md",
                isDenied ? "bg-danger/10" : isManual ? "bg-warning/10" : isAccuracy ? "bg-success/10" : "bg-primary/5",
              )}>
                <Icon className={cn(
                  "h-3 w-3",
                  isDenied ? "text-danger" : isManual ? "text-warning" : isAccuracy ? "text-success" : "text-primary",
                )} />
              </div>
            </div>
            <div className="text-lg font-semibold tracking-tight">
              {useHookCount(rawValue, metric, visible)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function useHookCount(rawValue: any, metric: MetricCardItem, visible: boolean) {
  const counted = useCountUp(
    metric.key === "peakHour" ? String(rawValue ?? "-") : (rawValue as number ?? 0),
    800,
    visible,
  );

  return <>{metric.key === "peakHour" ? rawValue ?? "-" : metric.format(parseInt(counted))}</>;
}

export { MetricGrid };
