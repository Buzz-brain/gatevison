import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Activity, AlertTriangle, Brain, BarChart3, Clock, Car,
  ScanEye, FileWarning, Sliders, TrendingUp, Users, Ban, UserCheck,
  Zap, History, Thermometer, Gauge, RefreshCw, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatNumber, formatPct } from "../utils";
import type { HourlyTraffic, DecisionBreakdown, SecurityInsight, RiskScore, RecognitionMetric, DailyTrend } from "../types";

type WeightKey = "plate" | "ocr" | "face" | "vehicle";

const WEIGHT_ICONS: Record<WeightKey, typeof ScanEye> = {
  plate: ScanEye,
  ocr: FileWarning,
  face: Brain,
  vehicle: Car,
};

interface WeightConfig {
  label: string;
  key: WeightKey;
  weight: number;
}

const DEFAULT_WEIGHTS: WeightConfig[] = [
  { label: "Plate Detection", key: "plate", weight: 35 },
  { label: "OCR Accuracy", key: "ocr", weight: 25 },
  { label: "Face Recognition", key: "face", weight: 25 },
  { label: "Vehicle Fingerprint", key: "vehicle", weight: 15 },
];

function TimelineBar({
  events,
  peakHours,
  prefersReduced,
}: {
  events: SecurityInsight[];
  peakHours: HourlyTraffic[];
  prefersReduced: boolean;
}) {
  const maxCount = useMemo(() => Math.max(...peakHours.map((h) => h.entries + h.exits), 1), [peakHours]);

  return (
    <div className="space-y-2">
      <div className="flex h-32 items-end gap-0.5">
        {peakHours.map((h, i) => {
          const total = h.entries + h.exits;
          const heightPct = (total / maxCount) * 100;
          const isEvent = events.some((e) => e.severity === "critical" || e.severity === "high");
          return (
            <motion.div
              key={i}
              className="relative flex-1 rounded-t"
              initial={prefersReduced ? undefined : { height: 0 }}
              animate={{ height: `${heightPct}%` }}
              transition={{ delay: i * 0.02, duration: 0.3 }}
            >
              <div
                className={cn(
                  "absolute inset-0 rounded-t",
                  total > maxCount * 0.8 ? "bg-danger/60" : total > maxCount * 0.5 ? "bg-warning/50" : "bg-primary/30",
                )}
                title={`${h.hour}: ${total} vehicles${isEvent && i > 18 ? " - Security event detected" : ""}`}
              />
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground/40">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}

function ThreatHeatmap({
  hourlyData,
  prefersReduced,
}: {
  hourlyData: HourlyTraffic[];
  prefersReduced: boolean;
}) {
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = 7;

  const grid = useMemo(() => {
    const cells: { day: number; hour: number; density: number; label: string }[] = [];
    for (let d = 0; d < days; d++) {
      for (let h = 0; h < 24; h++) {
        const base = hourlyData[h % hourlyData.length]?.entries ?? 20;
        const density = Math.min(100, Math.round(base * 0.8 + Math.sin((h / 24) * Math.PI * 2) * 20 + d * 3 + Math.random() * 10));
        cells.push({ day: d, hour: h, density, label: `${dayLabels[d]} ${h}:00` });
      }
    }
    return cells;
  }, [hourlyData]);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-px">
        <div className="w-8 shrink-0" />
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="flex-1 text-[7px] text-muted-foreground/30 text-center">{i % 3 === 0 ? i : ""}</div>
        ))}
      </div>
      {Array.from({ length: days }, (_, d) => (
        <div key={d} className="flex gap-px items-center">
          <div className="w-8 shrink-0 text-[8px] text-muted-foreground/50">{dayLabels[d]}</div>
          {grid.filter((c) => c.day === d).map((cell) => (
            <motion.div
              key={cell.hour}
              className="flex-1 aspect-square rounded-sm cursor-pointer"
              style={{ backgroundColor: `rgba(239, 68, 68, ${cell.density / 100})` }}
              title={cell.label}
              initial={prefersReduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.3, zIndex: 10 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function RecognitionConfidenceChart({
  data,
  prefersReduced,
}: {
  data: RecognitionMetric[];
  prefersReduced: boolean;
}) {
  const maxVal = useMemo(() => Math.max(...data.map((d) => d.accuracyPct), 100), [data]);

  return (
    <div className="space-y-3">
      {data.map((m, i) => {
        const metric = m;
        const Icon = WEIGHT_ICONS[metric.id as WeightKey] ?? ScanEye;
        return (
          <motion.div
            key={metric.id}
            initial={prefersReduced ? undefined : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="space-y-1"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3 text-muted-foreground" />
                <span>{metric.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-mono text-xs font-semibold tabular-nums",
                  metric.accuracyPct >= 95 ? "text-success" : metric.accuracyPct >= 90 ? "text-warning" : "text-danger",
                )}>
                  {metric.accuracyPct.toFixed(1)}%
                </span>
                <span className={cn("text-[10px]", metric.changePct >= 0 ? "text-success" : "text-danger")}>
                  {metric.changePct >= 0 ? "+" : ""}{metric.changePct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  backgroundColor: metric.accuracyPct >= 95 ? "var(--color-success)" : metric.accuracyPct >= 90 ? "var(--color-warning)" : "var(--color-danger)",
                }}
                initial={prefersReduced ? undefined : { width: 0 }}
                animate={{ width: `${(metric.accuracyPct / maxVal) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function FailureExplorer({
  decisions,
  reviews,
}: {
  decisions: DecisionBreakdown[];
  reviews: { plate: string; reason: string; confidence: number; status: string }[];
}) {
  const deniedCount = useMemo(() => decisions.find((d) => d.type === "denied")?.count ?? 0, [decisions]);
  const reviewCount = useMemo(() => decisions.find((d) => d.type === "manual_review")?.count ?? 0, [decisions]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 text-center">
          <Ban className="mx-auto mb-1 h-5 w-5 text-danger" />
          <p className="text-lg font-bold tabular-nums">{formatNumber(deniedCount)}</p>
          <p className="text-[10px] text-muted-foreground">Denied Entries</p>
        </Card>
        <Card className="p-3 text-center">
          <UserCheck className="mx-auto mb-1 h-5 w-5 text-warning" />
          <p className="text-lg font-bold tabular-nums">{formatNumber(reviewCount)}</p>
          <p className="text-[10px] text-muted-foreground">Manual Reviews</p>
        </Card>
      </div>
      <AnimatePresence>
        {reviews.slice(0, 5).map((r, i) => (
          <motion.div
            key={r.plate + i}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 rounded-lg bg-elevated/50 px-3 py-2"
          >
            <div className={cn(
              "h-2 w-2 rounded-full",
              r.status === "pending" ? "bg-warning" : r.status === "resolved" ? "bg-success" : "bg-danger",
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono font-medium">{r.plate}</p>
              <p className="text-[10px] text-muted-foreground truncate">{r.reason}</p>
            </div>
            <span className="text-[10px] font-mono tabular-nums">{r.confidence.toFixed(0)}%</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {reviews.length === 0 && (
        <p className="text-xs text-center text-muted-foreground/50 py-4">No failures to display</p>
      )}
    </div>
  );
}

function WhatIfSimulator({
  decisionData,
  prefersReduced,
}: {
  decisionData: DecisionBreakdown[];
  prefersReduced: boolean;
}) {
  const [weights, setWeights] = useState<WeightConfig[]>(DEFAULT_WEIGHTS.map((w) => ({ ...w })));
  const [simResult, setSimResult] = useState<{
    grantedDelta: number;
    deniedDelta: number;
  } | null>(null);

  const totalWeight = useMemo(() => weights.reduce((s, w) => s + w.weight, 0), [weights]);

  const grantedCount = useMemo(() => decisionData.find((d) => d.type === "granted")?.count ?? 4200, [decisionData]);
  const deniedCount = useMemo(() => decisionData.find((d) => d.type === "denied")?.count ?? 145, [decisionData]);
  const mrCount = useMemo(() => decisionData.find((d) => d.type === "manual_review")?.count ?? 55, [decisionData]);

  const updateWeight = useCallback((key: string, value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setWeights((prev) => {
      const adjusted = prev.map((w) => w.key === key ? { ...w, weight: clamped } : w);
      return adjusted;
    });
    setSimResult(null);
  }, []);

  const runSimulation = useCallback(() => {
    const avg = totalWeight / weights.length;
    const factor = avg / 25;
    const simGranted = Math.round(grantedCount * (1 + (factor - 1) * 0.05));
    const simDenied = Math.round(deniedCount * (1 + (1 - factor) * 0.1));
    setSimResult({
      grantedDelta: simGranted - grantedCount,
      deniedDelta: simDenied - deniedCount,
    });
  }, [weights, totalWeight, grantedCount, deniedCount]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {weights.map((w) => {
          const Icon = WEIGHT_ICONS[w.key] ?? ScanEye;
          return (
            <div key={w.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span>{w.label}</span>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums">{w.weight}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={w.weight}
                onChange={(e) => updateWeight(w.key, Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                aria-label={`${w.label} weight`}
              />
            </div>
          );
        })}
      </div>

      <Button
        variant="secondary"
        size="sm"
        className="w-full text-xs"
        onClick={runSimulation}
      >
        <Zap className="mr-1 h-3 w-3" /> Simulate
      </Button>

      <AnimatePresence>
        {simResult && (
          <motion.div
            initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 rounded-lg bg-elevated/50 p-3"
          >
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Simulation Result
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <p className={cn("text-sm font-bold tabular-nums", simResult.grantedDelta >= 0 ? "text-success" : "text-danger")}>
                  {simResult.grantedDelta >= 0 ? "+" : ""}{simResult.grantedDelta}
                </p>
                <p className="text-[9px] text-muted-foreground">Granted Change</p>
              </div>
              <div className="text-center">
                <p className={cn("text-sm font-bold tabular-nums", simResult.deniedDelta <= 0 ? "text-success" : "text-danger")}>
                  {simResult.deniedDelta <= 0 ? "" : "+"}{simResult.deniedDelta}
                </p>
                <p className="text-[9px] text-muted-foreground">Denied Change</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/70 text-center">
              Weight distribution: {weights.map((w) => `${w.label}: ${w.weight}%`).join(", ")}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExecutiveSummaryPanel({
  hourlyData,
  decisionData,
  recognitionData,
  dailyData,
}: {
  hourlyData: HourlyTraffic[];
  decisionData: DecisionBreakdown[];
  recognitionData: RecognitionMetric[];
  dailyData: DailyTrend[];
}) {
  const totalVehicles = useMemo(() => hourlyData.reduce((s, h) => s + h.entries + h.exits, 0), [hourlyData]);
  const avgProcessingTime = useMemo(() => {
    const count = hourlyData.length;
    return count > 0 ? Math.round(hourlyData.reduce((s, h) => s + (h.entries + h.exits) * 0.32, 0) / count * 100) / 100 : 320;
  }, [hourlyData]);
  const totalDec = useMemo(() => decisionData.reduce((s, d) => s + d.count, 0) || 1, [decisionData]);
  const grantCount = useMemo(() => decisionData.find((d) => d.type === "granted")?.count ?? 0, [decisionData]);
  const denyCount = useMemo(() => decisionData.find((d) => d.type === "denied")?.count ?? 0, [decisionData]);
  const mrTotal = useMemo(() => decisionData.find((d) => d.type === "manual_review")?.count ?? 0, [decisionData]);
  const grantRate = (grantCount / totalDec) * 100;
  const denyRate = (denyCount / totalDec) * 100;
  const mrRate = (mrTotal / totalDec) * 100;
  const peakPeriod = useMemo(() => {
    const peak = hourlyData.reduce((max, h) => h.entries + h.exits > max.entries + max.exits ? h : max, hourlyData[0] ?? { hour: "N/A", entries: 0, exits: 0 });
    return peak.hour;
  }, [hourlyData]);
  const mostActive = useMemo(() => {
    if (!dailyData.length) return "N/A";
    const peak = dailyData.reduce((max, d) => d.entries > max.entries ? d : max, dailyData[0]!);
    const date = new Date(peak.date);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }, [dailyData]);
  const recogRate = useMemo(() => {
    if (!recognitionData.length) return 93.5;
    return recognitionData.reduce((s, r) => s + r.accuracyPct, 0) / recognitionData.length;
  }, [recognitionData]);

  const summaryItems = [
    { label: "Total Vehicles", value: formatNumber(totalVehicles), icon: Car, color: "text-primary" },
    { label: "Avg Processing", value: `${avgProcessingTime.toFixed(0)}ms`, icon: Clock, color: "text-info" },
    { label: "Grant Rate", value: formatPct(grantRate), icon: TrendingUp, color: "text-success" },
    { label: "Denial Rate", value: formatPct(denyRate), icon: Ban, color: "text-danger" },
    { label: "Manual Review Rate", value: formatPct(mrRate), icon: UserCheck, color: "text-warning" },
    { label: "Peak Period", value: peakPeriod, icon: Thermometer, color: "text-warning" },
    { label: "Most Active Day", value: mostActive, icon: Calendar, color: "text-primary" },
    { label: "Recognition Rate", value: formatPct(recogRate), icon: ScanEye, color: "text-success" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {summaryItems.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg bg-elevated/50 p-3"
          >
            <Icon className={cn("mb-1 h-4 w-4", item.color)} />
            <p className="text-lg font-bold tabular-nums">{item.value}</p>
            <p className="text-[10px] text-muted-foreground/70">{item.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

interface SICProps {
  hourly: HourlyTraffic[];
  daily: DailyTrend[];
  decision: DecisionBreakdown[];
  security: SecurityInsight[];
  risk: RiskScore | null;
  recognition: RecognitionMetric[];
  manualReviews: { plate: string; reason: string; confidence: number; status: string }[];
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

const TAB_KEYS = [
  "executive",
  "timeline",
  "heatmap",
  "confidence",
  "failures",
  "simulator",
] as const;

type TabKey = (typeof TAB_KEYS)[number];

const TAB_CONFIG: Record<TabKey, { label: string; icon: typeof Shield }> = {
  executive: { label: "Executive Summary", icon: BarChart3 },
  timeline: { label: "Security Timeline", icon: Activity },
  heatmap: { label: "Threat Heatmap", icon: Thermometer },
  confidence: { label: "AI Confidence", icon: Brain },
  failures: { label: "Failure Explorer", icon: AlertTriangle },
  simulator: { label: "What-If Simulator", icon: Sliders },
};

export function SecurityIntelligenceCenter({
  hourly,
  daily,
  decision,
  security,
  risk,
  recognition,
  manualReviews,
  isLoading,
  isError,
  onRetry,
}: SICProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("executive");
  const prefersReduced = useReducedMotion();

  if (isLoading) {
    return (
      <Card className="p-5 space-y-4">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-5 text-center">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-danger" />
        <p className="text-sm text-muted-foreground mb-2">Security Intelligence Center failed to load</p>
        {onRetry && (
          <Button variant="outline" size="xs" onClick={onRetry}>
            <RefreshCw className="mr-1 h-3 w-3" /> Retry
          </Button>
        )}
      </Card>
    );
  }

  const TabIcon = TAB_CONFIG[activeTab].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Security Intelligence Center</h3>
          <Badge variant="info" size="sm" className="text-[9px]">SOC Analytics</Badge>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          Live
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1">
        {TAB_KEYS.map((key) => {
          const config = TAB_CONFIG[key];
          const I = config.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === key
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-elevated hover:text-foreground",
              )}
            >
              <I className="h-3.5 w-3.5" />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="min-h-[200px]"
        >
          {activeTab === "executive" && (
            <ExecutiveSummaryPanel
              hourlyData={hourly}
              decisionData={decision}
              recognitionData={recognition}
              dailyData={daily}
            />
          )}

          {activeTab === "timeline" && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-4">
                <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Security Event Timeline
                </h4>
                <TimelineBar events={security} peakHours={hourly} prefersReduced={prefersReduced} />
                <div className="mt-3 space-y-1.5">
                  {security.slice(0, 4).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        s.severity === "critical" ? "bg-danger" : s.severity === "high" ? "bg-warning" : "bg-success",
                      )} />
                      <span className="flex-1 truncate">{s.title}</span>
                      <Badge
                        variant={s.severity === "critical" || s.severity === "high" ? "danger" : "warning"}
                        size="sm"
                        className="text-[8px]"
                      >
                        {s.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-4">
                <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Risk Assessment
                </h4>
                {risk ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Gauge className={cn(
                        "h-8 w-8",
                        risk.level === "critical" ? "text-danger" : risk.level === "high" ? "text-warning" : "text-success",
                      )} />
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{risk.overallPct}%</p>
                        <Badge
                          variant={risk.level === "critical" || risk.level === "high" ? "danger" : risk.level === "medium" ? "warning" : "success"}
                          size="sm"
                        >
                          {risk.level.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {risk.factors.slice(0, 4).map((f) => (
                        <div key={f.label} className="flex items-center gap-2 text-xs">
                          <div className="flex-1">
                            <div className="flex justify-between mb-0.5">
                              <span className="truncate">{f.label}</span>
                              <span className="tabular-nums text-muted-foreground">{f.contributionPct}%</span>
                            </div>
                            <div className="h-1 rounded-full bg-border overflow-hidden">
                              <div
                                className="h-full rounded-full bg-danger/60"
                                style={{ width: `${f.contributionPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/50">No risk data available</p>
                )}
              </Card>
            </div>
          )}

          {activeTab === "heatmap" && (
            <Card className="p-4">
              <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Traffic Density Heatmap — Hour by Day
              </h4>
              <ThreatHeatmap hourlyData={hourly} prefersReduced={prefersReduced} />
            </Card>
          )}

          {activeTab === "confidence" && (
            <Card className="p-4">
              <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI Recognition Confidence Analytics
              </h4>
              <RecognitionConfidenceChart data={recognition} prefersReduced={prefersReduced} />
            </Card>
          )}

          {activeTab === "failures" && (
            <Card className="p-4">
              <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recognition Failure Explorer
              </h4>
              <FailureExplorer decisions={decision} reviews={manualReviews} />
            </Card>
          )}

          {activeTab === "simulator" && (
            <Card className="p-4">
              <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                What-If Decision Weight Simulator
              </h4>
              <p className="mb-4 text-[10px] text-muted-foreground/60">
                Adjust decision engine weights to see how historical access decisions would change. This simulation runs entirely on the frontend.
              </p>
              <WhatIfSimulator decisionData={decision} prefersReduced={prefersReduced} />
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
