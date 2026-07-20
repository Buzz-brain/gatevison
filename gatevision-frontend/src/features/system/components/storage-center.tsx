import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  HardDrive,
  HardDriveDownload,
  AlertTriangle,
  FileX,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { StorageData, StorageItem } from "../types";

interface StorageCenterProps {
  storage: StorageData;
}

function DonutChart({
  items,
  totalUsed,
  reduced,
}: {
  items: StorageItem[];
  totalUsed: number;
  reduced: boolean;
}) {
  const radius = 70;
  const stroke = 20;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    if (totalUsed === 0) return [];
    let accum = 0;
    return items.map((item) => {
      const pct = item.usedGb / totalUsed;
      const dashLen = pct * circumference;
      const dashOffset = -accum * circumference;
      accum += pct;
      return {
        ...item,
        pct,
        dashLen,
        dashOffset,
        gap: circumference - dashLen,
      };
    });
  }, [items, totalUsed, circumference]);

  return (
    <div className="relative flex items-center justify-center" aria-hidden="true">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Background ring */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={stroke}
        />
        {/* Colored segments */}
        {segments.map((seg, i) => (
          <motion.circle
            key={seg.id}
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${seg.dashLen} ${seg.gap}`}
            strokeDashoffset={seg.dashOffset}
            strokeLinecap="butt"
            transform="rotate(-90 100 100)"
            initial={
              reduced
                ? { opacity: 0.85 }
                : { opacity: 0, strokeDasharray: `0 ${circumference}` }
            }
            animate={{
              opacity: 0.85,
              strokeDasharray: `${seg.dashLen} ${seg.gap}`,
            }}
            transition={{ duration: 0.8, delay: reduced ? 0 : i * 0.12, ease: "easeOut" }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <HardDrive className="h-5 w-5 text-muted-foreground mb-1" />
        <span className="text-xl font-bold tabular-nums">{totalUsed.toFixed(1)}</span>
        <span className="text-[10px] text-muted-foreground">GB Used</span>
      </div>
    </div>
  );
}

function Sparkline({
  data,
  color = "#3b82f6",
  width = 120,
  height = 32,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = width / Math.max(data.length - 1, 1);

  const pathData = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath =
    pathData +
    ` L ${(data.length - 1) * step} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#storageGrad)" />
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

export function StorageCenter({ storage }: StorageCenterProps) {
  const reduced = useReducedMotion();

  const usagePct =
    storage.totalGb > 0
      ? (storage.totalUsedGb / storage.totalGb) * 100
      : 0;

  return (
    <Card className="p-6" role="region" aria-label="Storage center">
      <div className="flex items-center gap-2 mb-6">
        <HardDriveDownload className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Storage Center</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Donut + Legend */}
        <div className="flex flex-col items-center gap-4">
          <DonutChart
            items={storage.items}
            totalUsed={storage.totalUsedGb}
            reduced={reduced}
          />

          {/* Usage bar */}
          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">
                {storage.totalUsedGb.toFixed(1)} / {storage.totalGb} GB
              </span>
              <span className="text-xs font-medium tabular-nums">
                {usagePct.toFixed(1)}%
              </span>
            </div>
            <Progress value={usagePct} />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-3">
            {storage.items.map((item) => (
              <div key={item.id} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] text-muted-foreground">
                  {item.label}
                </span>
                <span className="text-[11px] font-medium tabular-nums text-foreground">
                  {item.usedGb.toFixed(1)}GB
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Total Files</p>
              <p className="text-lg font-bold tabular-nums">
                {storage.items.reduce((sum, item) => sum + item.files, 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <FileX className="h-3 w-3 text-warning" />
                <p className="text-[10px] text-muted-foreground">Orphaned</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold tabular-nums">{storage.orphanCount}</p>
                {storage.orphanCount > 0 && (
                  <Badge variant="warning" size="sm">Cleanup</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Growth trend */}
          <div className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-xs text-muted-foreground">Growth Trend</span>
              </div>
              <Badge variant={storage.growthTrend[storage.growthTrend.length - 1]! > storage.growthTrend[0]! ? "warning" : "success"} size="sm">
                {storage.growthTrend[storage.growthTrend.length - 1]! > storage.growthTrend[0]!
                  ? "Increasing"
                  : "Stable"}
              </Badge>
            </div>
            <Sparkline data={storage.growthTrend} color="#3b82f6" width={280} height={40} />
          </div>

          {/* Largest files */}
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-muted-foreground mb-2">Largest Files</p>
            <div className="space-y-1.5">
              {storage.largestFiles.slice(0, 4).map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-foreground truncate max-w-[180px] font-mono text-[11px]">
                    {file.path}
                  </span>
                  <span className="text-muted-foreground tabular-nums ml-2 shrink-0">
                    {file.sizeGb.toFixed(1)}GB
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cleanup recommendation */}
      {storage.cleanupRec && (
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: reduced ? 0 : 0.3 }}
          className="mt-6 rounded-lg border border-warning/20 bg-warning/5 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center rounded-lg bg-warning/10 p-2 shrink-0">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Cleanup Recommendation
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {storage.cleanupRec}
              </p>
            </div>
            <Button variant="warning" size="sm" className="shrink-0">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clean Up
            </Button>
          </div>
        </motion.div>
      )}
    </Card>
  );
}
