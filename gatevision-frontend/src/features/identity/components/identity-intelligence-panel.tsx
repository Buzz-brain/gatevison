import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  BrainCircuit, ShieldCheck, AlertTriangle, Users, Car, Activity,
  TrendingUp, Target, Eye, Zap, Fingerprint, ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useIdentityStats, useIdentityActivity } from "../hooks/use-identity-api";
import type { IdentityStats, ActivityItem } from "../types";

interface IntelMetric {
  label: string;
  value: string;
  trend: "up" | "down" | "stable";
  pct: number;
  icon: typeof BrainCircuit;
}

interface ThreatSignal {
  id: string;
  type: "anomaly" | "breach_attempt" | "policy_violation" | "spoof_detected";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: string;
}

interface IdentityCluster {
  id: string;
  label: string;
  count: number;
  color: string;
  active: boolean;
}

const EMPTY_STATS: IdentityStats = {
  totalDrivers: 0,
  totalVehicles: 0,
  totalPolicies: 0,
  enrollmentRate: 0,
  verificationSuccess: 0,
  recognitionQuality: 0,
  driversByStatus: {} as IdentityStats["driversByStatus"],
};

const CLUSTER_DEFS: { id: keyof IdentityStats["driversByStatus"]; label: string; color: string }[] = [
  { id: "verified", label: "Verified", color: "bg-success" },
  { id: "vip", label: "VIP", color: "bg-primary" },
  { id: "pending", label: "Pending", color: "bg-warning" },
  { id: "visitor", label: "Visitor", color: "bg-info" },
  { id: "suspended", label: "Suspended", color: "bg-danger" },
  { id: "expired", label: "Expired", color: "bg-muted-foreground" },
];

function useLiveTick(intervalMs = 3000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return tick;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff) || diff < 0) return "just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function activityThreatType(type: ActivityItem["type"]): ThreatSignal["type"] {
  switch (type) {
    case "policy_changed": return "policy_violation";
    case "identity_verified": return "anomaly";
    case "vehicle_registered": return "anomaly";
    case "link": return "anomaly";
    default: return "anomaly";
  }
}

function activitySeverity(type: ActivityItem["type"]): ThreatSignal["severity"] {
  switch (type) {
    case "policy_changed": return "medium";
    case "identity_verified": return "low";
    default: return "low";
  }
}

function severityColor(s: string): string {
  switch (s) {
    case "critical": return "border-danger/50 bg-danger/10 text-danger";
    case "high": return "border-warning/50 bg-warning/10 text-warning";
    case "medium": return "border-info/50 bg-info/10 text-info";
    default: return "border-border bg-surface text-muted-foreground";
  }
}

function threatIcon(type: string) {
  switch (type) {
    case "anomaly": return Activity;
    case "breach_attempt": return AlertTriangle;
    case "policy_violation": return ShieldCheck;
    case "spoof_detected": return Eye;
    default: return AlertTriangle;
  }
}

function IdentityIntelligencePanel() {
  const prefersReduced = useReducedMotion();
  const tick = useLiveTick(4000);
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [scanActive, setScanActive] = useState(true);

  const radarRef = useRef<HTMLDivElement>(null);

  const { data: statsData } = useIdentityStats();
  const { data: activity } = useIdentityActivity();

  const stats = useMemo(() => statsData ?? EMPTY_STATS, [statsData]);

  const METRICS = useMemo<IntelMetric[]>(() => {
    const totalProfiles = stats.totalDrivers + stats.totalVehicles;
    return [
      { label: "Verification Rate", value: `${stats.verificationSuccess.toFixed(1)}%`, trend: "up", pct: stats.verificationSuccess, icon: ShieldCheck },
      { label: "Recognition QOS", value: `${stats.recognitionQuality.toFixed(1)}%`, trend: "up", pct: stats.recognitionQuality, icon: Target },
      { label: "Active Profiles", value: totalProfiles.toLocaleString(), trend: "up", pct: 75, icon: Users },
      { label: "Access Policies", value: String(stats.totalPolicies), trend: "stable", pct: 50, icon: Fingerprint },
      { label: "Enrollment Rate", value: `${stats.enrollmentRate.toFixed(1)}%`, trend: "stable", pct: stats.enrollmentRate, icon: Activity },
      { label: "Total Drivers", value: String(stats.totalDrivers), trend: "stable", pct: 60, icon: Car },
    ];
  }, [stats]);

  const THREAT_SIGNALS = useMemo<ThreatSignal[]>(() => {
    if (!activity || activity.length === 0) return [];
    return activity.slice(0, 6).map((a, i) => ({
      id: `ts-${a.id ?? i}`,
      type: activityThreatType(a.type),
      severity: activitySeverity(a.type),
      title: a.title,
      description: a.description,
      timestamp: relativeTime(a.timestamp),
    }));
  }, [activity]);

  const CLUSTERS = useMemo<IdentityCluster[]>(() => {
    return CLUSTER_DEFS.map((d) => ({
      id: d.id,
      label: d.label,
      color: d.color,
      count: stats.driversByStatus[d.id] ?? 0,
      active: true,
    }));
  }, [stats]);

  const BIOMETRIC_HEALTH = useMemo(() => {
    return [
      { label: "Face Enrollment", value: stats.enrollmentRate, color: "bg-success" },
      { label: "Verification Success", value: stats.verificationSuccess, color: "bg-primary" },
      { label: "Recognition Quality", value: stats.recognitionQuality, color: "bg-success" },
      { label: "Match Accuracy", value: +(stats.verificationSuccess * 0.95).toFixed(1), color: "bg-primary" },
    ];
  }, [stats]);

  const confidenceScore = useMemo(() => {
    const sum = stats.verificationSuccess + stats.recognitionQuality + stats.enrollmentRate;
    return Math.round(sum / 3);
  }, [stats]);

  const animatedMetrics = METRICS.map((m, i) => ({
    ...m,
    currentPct: Math.min(m.pct, (tick % 20) * 5 + Math.sin(tick * 0.5 + i) * 3),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
            <BrainCircuit className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Identity Intelligence</h3>
            <p className="text-[10px] text-muted-foreground/60">AI-powered identity analytics & threat detection</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={scanActive ? "success" : "neutral"}>
            <Zap className="mr-1 h-3 w-3" />
            {scanActive ? "Live" : "Paused"}
          </Badge>
          <button
            onClick={() => setScanActive(!scanActive)}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-[10px] text-muted-foreground hover:bg-surface"
          >
            {scanActive ? "||" : ">"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {animatedMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label} className={cn("p-3 transition-all", scanActive && "hover:border-primary/30")}>
              <div className="flex items-center gap-1.5">
                <Icon className="h-3 w-3 text-muted-foreground/60" />
                <span className="text-[10px] text-muted-foreground/60">{m.label}</span>
              </div>
              <p className="mt-1 text-lg font-semibold tabular-nums">{m.value}</p>
              <div className="mt-1.5 h-1 rounded-full bg-border">
                <motion.div
                  className={cn("h-full rounded-full", m.trend === "up" ? "bg-success" : m.trend === "down" ? "bg-danger" : "bg-primary")}
                  animate={prefersReduced ? {} : { width: `${m.currentPct}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-danger" />
            <span className="text-xs font-medium">Threat Signals</span>
            <Badge variant="danger" className="ml-auto text-[10px]">{THREAT_SIGNALS.length} Active</Badge>
          </div>
          <div className="space-y-2">
            {THREAT_SIGNALS.length === 0 ? (
              <Card className="flex items-center justify-center gap-2 border-dashed p-6 text-muted-foreground/60">
                <ScanLine className="h-4 w-4" />
                <span className="text-xs">No threat signals in recent identity activity</span>
              </Card>
            ) : (
              THREAT_SIGNALS.map((ts, i) => {
                const Icon = threatIcon(ts.type);
                return (
                  <motion.div
                    key={ts.id}
                    initial={prefersReduced ? {} : { opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className={cn("flex items-start gap-3 border-l-2 p-3", severityColor(ts.severity).split(" ")[0] || "border-border")}>
                      <div className={cn("flex h-7 w-7 items-center justify-center rounded-full", severityColor(ts.severity).split(" ")[1] || "bg-surface")}>
                        <Icon className={cn("h-3.5 w-3.5", severityColor(ts.severity).split(" ")[2] || "text-muted-foreground")} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{ts.title}</span>
                          <Badge variant={ts.severity === "critical" ? "danger" : ts.severity === "high" ? "warning" : ts.severity === "medium" ? "info" : "neutral"} className="text-[9px]">
                            {ts.severity}
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/70">{ts.description}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/50">{ts.timestamp}</p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <ScanLine className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Identity Radar</span>
              <span className="text-[10px] text-muted-foreground/50">Real-time cluster analysis</span>
            </div>
            <div ref={radarRef} className="relative flex h-48 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface/50">
              <div className="absolute inset-0">
                <svg viewBox="0 0 200 200" className="h-full w-full opacity-20">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
                  <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
                  <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="0.3" className="text-border" />
                  <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="0.3" className="text-border" />
                </svg>
              </div>
              {scanActive && (
                <motion.div
                  className="absolute left-1/2 top-1/2 h-0.5 w-24 origin-left bg-gradient-to-r from-transparent via-primary to-transparent"
                  animate={prefersReduced ? {} : { rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ x: 0, y: 0 }}
                />
              )}
              {CLUSTERS.map((c, i) => {
                const angle = (i / CLUSTERS.length) * Math.PI * 2;
                const radius = 30 + Math.sin(tick * 0.02 + i * 1.2) * 20 + 20;
                const x = 100 + Math.cos(angle + tick * 0.005) * radius;
                const y = 100 + Math.sin(angle + tick * 0.005) * radius;
                return (
                  <motion.div
                    key={c.id}
                    className={cn(
                      "absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[9px] font-bold text-white transition-opacity",
                      c.color,
                      activeCluster && activeCluster !== c.id && "opacity-30",
                    )}
                    animate={prefersReduced ? {} : { x: x - 100, y: y - 100 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    onClick={() => setActiveCluster(activeCluster === c.id ? null : c.id)}
                    style={{ left: 100, top: 100 }}
                  >
                    {c.count}
                    <div className="absolute -bottom-4 whitespace-nowrap text-[8px] text-muted-foreground">{c.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Identity Profile Distribution</span>
          </div>
          <Card className="p-4">
            <div className="space-y-2">
              {CLUSTERS.map((c) => {
                const total = CLUSTERS.reduce((s, x) => s + x.count, 0);
                const pct = total > 0 ? ((c.count / total) * 100).toFixed(1) : "0.0";
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground/70">{c.label}</span>
                      <span className="font-medium tabular-nums">{c.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border">
                      <motion.div
                        className={cn("h-full rounded-full", c.color)}
                        initial={prefersReduced ? {} : { width: "0%" }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: CLUSTERS.indexOf(c) * 0.1 }}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground/50">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Fingerprint className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Biometric Health</span>
            </div>
            <div className="space-y-3">
              {BIOMETRIC_HEALTH.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground/70">{item.label}</span>
                    <span className="font-medium tabular-nums">{item.value.toFixed(1)}%</span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded-full bg-border">
                    <motion.div
                      className={cn("h-full rounded-full", item.color)}
                      initial={prefersReduced ? {} : { width: "0%" }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <BrainCircuit className="h-4 w-4 text-primary" />
              <span className="text-[11px] text-muted-foreground/70">AI Confidence Score</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{confidenceScore}%</p>
            <p className="text-[10px] text-muted-foreground/50">aggregate of verification, recognition & enrollment</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export { IdentityIntelligencePanel };
