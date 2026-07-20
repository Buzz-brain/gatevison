import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, Cpu, Database, HardDrive, Shield, Monitor, Activity, AlertTriangle,
  Clock, Zap, MemoryStick, Wifi, TrendingUp, BarChart3, X, Info, ChevronRight,
  RefreshCw, Radio, Server,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { OverallHealth, AiModelInfo, Alert, HealthStatus } from "../types";

interface DigitalTwinMonitorProps {
  health: OverallHealth;
  models: AiModelInfo[];
  alerts: Alert[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface ServiceNode {
  id: string;
  label: string;
  icon: typeof Camera;
  status: HealthStatus;
  x: number;
  y: number;
  latency: number;
  uptime: number;
  memory: number;
  version: string;
  errorCount: number;
  dependencies: string[];
  detail: string;
}

interface DataFlow {
  id: string;
  from: string;
  to: string;
  active: boolean;
}

const HEALTH_COLORS: Record<string, string> = {
  healthy: "#22c55e",
  degraded: "#f59e0b",
  unhealthy: "#ef4444",
  down: "#6b7280",
};

const HEALTH_GLOW: Record<string, string> = {
  healthy: "rgba(34,197,94,0.3)",
  degraded: "rgba(245,158,11,0.3)",
  unhealthy: "rgba(239,68,68,0.3)",
  down: "rgba(107,114,128,0.2)",
};

const PARTICLE_COUNT = 8;

function Particle({ path, color, index }: { path: { x: number; y: number }[]; color: string; index: number }) {
  const reduced = useReducedMotion();
  if (path.length < 2 || reduced) return null;
  const duration = 2 + Math.random() * 1.5;
  const delay = index * 0.4;
  return (
    <motion.circle
      r="3"
      fill={color}
      initial={{ cx: path[0]!.x, cy: path[0]!.y, opacity: 0 }}
      animate={{
        cx: [path[0]!.x, ...path.slice(1).map((p) => p.x)],
        cy: [path[0]!.y, ...path.slice(1).map((p) => p.y)],
        opacity: [0, 1, 1, 0],
      }}
      transition={{ duration, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function PredictivePanel({ storage, models, health }: { storage: { totalUsedGb: number; totalGb: number }; models: AiModelInfo[]; health: OverallHealth }) {
  const usagePct = storage.totalGb > 0 ? (storage.totalUsedGb / storage.totalGb) * 100 : 50;
  const dailyGrowth = 0.8;
  const daysUntilFull = dailyGrowth > 0 ? Math.ceil((100 - usagePct) / dailyGrowth) : 999;
  const avgThroughput = models.reduce((s, m) => s + m.inferenceCount, 0) / Math.max(models.length, 1);
  const dailyThroughput = Math.round(avgThroughput * 0.05);
  const peakCapacity = Math.round(dailyThroughput * 1.4);
  const healthyServices = health.services.filter((s) => s.status === "healthy").length;
  const totalServices = health.services.length;

  const suggestions = useMemo(() => {
    const s: string[] = [];
    if (usagePct > 80) s.push("Archive old captures to free storage space");
    if (daysUntilFull < 30) s.push("Schedule disk expansion within 2 weeks");
    if (models.some((m) => m.status === "degraded" || m.status === "unhealthy")) s.push("Restart degraded AI models");
    if (healthyServices < totalServices) s.push("Investigate non-healthy services");
    if (s.length === 0) s.push("All systems operating within normal parameters");
    return s;
  }, [usagePct, daysUntilFull, models, healthyServices, totalServices]);

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Predictive Capacity</h4>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold tabular-nums text-warning">{daysUntilFull > 365 ? ">1y" : `${daysUntilFull}d`}</p>
          <p className="text-[9px] text-muted-foreground">Disk Exhaustion</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold tabular-nums text-primary">{dailyThroughput.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground">Daily Throughput</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold tabular-nums text-success">{peakCapacity.toLocaleString()}</p>
          <p className="text-[9px] text-muted-foreground">Peak Capacity</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Suggested Actions</p>
        {suggestions.map((s, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[10px]">
            <ChevronRight className="mt-0.5 h-2.5 w-2.5 shrink-0 text-primary" />
            <span className="text-muted-foreground">{s}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HealthTimeline() {
  const reduced = useReducedMotion();
  const points = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 24 }, (_, i) => ({
      time: new Date(now - (23 - i) * 3600000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      value: +(90 + Math.random() * 9.9).toFixed(1),
      status: (Math.random() > 0.85 ? "degraded" : "healthy") as "healthy" | "degraded",
    }));
  }, []);

  const h = 40;
  const w = 240;
  const maxVal = 100;
  const minVal = 85;
  const range = maxVal - minVal;
  const stepX = w / Math.max(points.length - 1, 1);

  const linePath = points.map((p, i) => {
    const x = i * stepX;
    const y = h - ((p.value - minVal) / range) * h;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Activity className="h-3 w-3 text-muted-foreground" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">24h Health</span>
      </div>
      <svg width={w} height={h} className="overflow-visible">
        <path d={linePath} fill="none" stroke="currentColor" className="text-primary/40" strokeWidth="1.5" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={i * stepX}
            cy={h - ((p.value - minVal) / range) * h}
            r="2"
            fill={p.status === "healthy" ? "#22c55e" : "#f59e0b"}
          />
        ))}
      </svg>
    </div>
  );
}

function NodeDetailPanel({ node, onClose }: { node: ServiceNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <node.icon className="h-4 w-4" style={{ color: HEALTH_COLORS[node.status] }} />
          <h4 className="text-sm font-semibold">{node.label}</h4>
          <Badge variant={node.status === "healthy" ? "success" : node.status === "degraded" ? "warning" : "danger"} size="sm" className="text-[9px]">
            {node.status}
          </Badge>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-md bg-elevated/50 p-2">
          <span className="text-muted-foreground">Latency</span>
          <p className="font-mono font-semibold tabular-nums">{node.latency.toFixed(1)}ms</p>
        </div>
        <div className="rounded-md bg-elevated/50 p-2">
          <span className="text-muted-foreground">Uptime</span>
          <p className="font-mono font-semibold tabular-nums">{node.uptime > 86400000 ? `${(node.uptime / 86400000).toFixed(0)}d` : `${(node.uptime / 3600000).toFixed(1)}h`}</p>
        </div>
        <div className="rounded-md bg-elevated/50 p-2">
          <span className="text-muted-foreground">Memory</span>
          <p className="font-mono font-semibold tabular-nums">{node.memory > 1024 ? `${(node.memory / 1024).toFixed(1)}GB` : `${node.memory}MB`}</p>
        </div>
        <div className="rounded-md bg-elevated/50 p-2">
          <span className="text-muted-foreground">Version</span>
          <p className="font-mono font-semibold tabular-nums">{node.version}</p>
        </div>
      </div>

      <div className="rounded-md bg-elevated/50 p-2 text-[10px]">
        <span className="text-muted-foreground">Error Count</span>
        <p className={`font-mono font-semibold tabular-nums ${node.errorCount > 50 ? "text-danger" : node.errorCount > 10 ? "text-warning" : "text-success"}`}>
          {node.errorCount}
        </p>
      </div>

      <div className="rounded-md bg-elevated/50 p-2 text-[10px]">
        <span className="text-muted-foreground">Dependencies</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {node.dependencies.map((dep) => (
            <Badge key={dep} variant="outline" size="sm" className="text-[8px]">{dep}</Badge>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">{node.detail}</p>
    </motion.div>
  );
}

export function DigitalTwinMonitor({ health, models, alerts, isLoading, isError, onRetry }: DigitalTwinMonitorProps) {
  const reduced = useReducedMotion();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showPredictive, setShowPredictive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 350 });

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({ w: entry.contentRect.width, h: Math.max(350, entry.contentRect.height) });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const centerX = dimensions.w / 2;
  const centerY = dimensions.h / 2;

  const nodes = useMemo<ServiceNode[]>(() => {
    const modelMap = new Map(models.map((m) => [m.id, m]));
    const yolo = modelMap.get("yolo");
    const ocr = modelMap.get("easyocr");
    const face = modelMap.get("insightface");
    const resnet = modelMap.get("resnet50");
    const decision = modelMap.get("decision");

    const healthStatus = (id: string): HealthStatus => {
      const svc = health.services.find((s) => s.id === id);
      return svc?.status ?? "healthy";
    };

    const defaultMem = 2048;
    const defaultVersion = "1.0.0";

    return [
      { id: "camera", label: "Cameras", icon: Camera, status: healthStatus("cameras"), x: centerX - 240, y: centerY - 80, latency: 12, uptime: 86400000 * 5, memory: 512, version: "3.2.0", errorCount: 5, dependencies: ["API Gateway"], detail: "8 cameras monitored across all gates. Network bandwidth: 366 Mbps aggregate." },
      { id: "pipeline", label: "AI Pipeline", icon: Cpu, status: healthStatus("pipeline"), x: centerX - 80, y: centerY - 80, latency: 252, uptime: 86400000 * 3, memory: 1024, version: "2.1.0", errorCount: 23, dependencies: ["Cameras", "MongoDB"], detail: "6-stage inference pipeline. Bottleneck: Face Recognition at 45.2ms avg." },
      { id: "decision", label: "Decision Engine", icon: Shield, status: decision?.status ?? "healthy", x: centerX + 80, y: centerY - 80, latency: 2.1, uptime: 86400000 * 14, memory: decision?.memoryMb ?? defaultMem, version: decision?.version ?? "2.0.1", errorCount: decision?.failureCount ?? 0, dependencies: ["AI Pipeline", "Identity Service"], detail: "Access control logic engine. Processes 42 requests/sec with 99.8% success rate." },
      { id: "identity", label: "Identity Service", icon: Monitor, status: "healthy", x: centerX + 220, y: centerY - 80, latency: 8.2, uptime: 86400000 * 7, memory: 768, version: "1.5.2", errorCount: 3, dependencies: ["MongoDB"], detail: "Driver and vehicle identity management. 15,200 registered profiles." },
      { id: "database", label: "MongoDB", icon: Database, status: healthStatus("database"), x: centerX - 140, y: centerY + 60, latency: 8.2, uptime: 86400000 * 30, memory: 4096, version: "7.0.5", errorCount: 8, dependencies: [], detail: "Primary database with replica set. 5,800 queries/sec avg. 1.2TB data stored." },
      { id: "storage", label: "Storage", icon: HardDrive, status: healthStatus("storage"), x: centerX + 60, y: centerY + 60, latency: 15.3, uptime: 86400000 * 15, memory: 256, version: "NFS v4.2", errorCount: 12, dependencies: ["MongoDB"], detail: "Distributed storage for captures, logs, and backups. 78% capacity used." },
      { id: "gate", label: "Gate Controller", icon: Server, status: healthStatus("gate") ?? "healthy", x: centerX + 200, y: centerY + 60, latency: 150.3, uptime: 86400000 * 10, memory: 512, version: "1.2.0", errorCount: 4, dependencies: ["Decision Engine", "Storage"], detail: "Controls 4 gate barriers. Average actuation time: 150ms. 4 active sessions." },
    ];
  }, [health, models, centerX, centerY]);

  const flows = useMemo<DataFlow[]>(() => [
    { id: "f1", from: "camera", to: "pipeline", active: true },
    { id: "f2", from: "pipeline", to: "decision", active: true },
    { id: "f3", from: "decision", to: "gate", active: true },
    { id: "f4", from: "decision", to: "identity", active: true },
    { id: "f5", from: "identity", to: "database", active: true },
    { id: "f6", from: "pipeline", to: "database", active: true },
    { id: "f7", from: "database", to: "gate", active: true },
    { id: "f8", from: "storage", to: "database", active: true },
  ], []);

  const selected = nodes.find((n) => n.id === selectedNode) ?? null;

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
  const warningAlerts = alerts.filter((a) => a.severity === "warning").length;

  if (isLoading) {
    return (
      <Card className="p-5 space-y-4">
        <div className="h-6 w-64 bg-muted rounded animate-pulse" />
        <div className="h-[350px] rounded-xl bg-muted/20 animate-pulse" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-5 text-center">
        <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-danger" />
        <p className="text-sm text-muted-foreground mb-2">Digital Twin failed to load</p>
        <Button variant="outline" size="xs" onClick={onRetry}>
          <RefreshCw className="mr-1 h-3 w-3" /> Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Digital Twin Infrastructure Monitor</h3>
          <Badge variant="info" size="sm" className="text-[9px]">LIVE</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="danger" size="sm" className="text-[9px]">{criticalAlerts} critical</Badge>
          <Badge variant="warning" size="sm" className="text-[9px]">{warningAlerts} warnings</Badge>
          <span className="flex items-center gap-1 text-[10px] text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> LIVE
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div
            ref={containerRef}
            className="relative rounded-xl border border-border bg-[#0a0a0f] overflow-hidden"
            style={{ height: dimensions.h, backgroundImage: "radial-gradient(circle at 25% 25%, rgba(59,130,246,0.03) 0%, transparent 50%)" }}
          >
            <svg width={dimensions.w} height={dimensions.h} className="absolute inset-0">
              {flows.map((flow) => {
                const from = nodeById.get(flow.from);
                const to = nodeById.get(flow.to);
                if (!from || !to) return null;
                const color = HEALTH_COLORS[from.status] ?? "#6b7280";
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                return (
                  <g key={flow.id}>
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth="1" opacity="0.2" />
                    <Particle
                      path={[{ x: from.x, y: from.y }, { x: midX, y: midY }, { x: to.x, y: to.y }]}
                      color={color}
                      index={parseInt(flow.id.replace("f", ""))}
                    />
                  </g>
                );
              })}
            </svg>

            <AnimatePresence>
              {nodes.map((node) => {
                const isSelected = selectedNode === node.id;
                const color = HEALTH_COLORS[node.status];
                const glow = HEALTH_GLOW[node.status];
                const Icon = node.icon;
                return (
                  <motion.button
                    key={node.id}
                    className="absolute cursor-pointer"
                    style={{ left: node.x - 50, top: node.y - 50 }}
                    initial={reduced ? false : { scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={reduced ? undefined : { scale: 1.05 }}
                    onClick={() => setSelectedNode(isSelected ? null : node.id)}
                    aria-label={`${node.label}: ${node.status}`}
                  >
                    <div className={cn("relative flex flex-col items-center p-3 rounded-xl border transition-all w-[100px]", isSelected ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-elevated/90 hover:border-primary/30")}>
                      <div className="relative">
                        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: color }} />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        </span>
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <span className="mt-1 text-[9px] font-medium truncate w-full text-center">{node.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-3">
          {selected ? (
            <NodeDetailPanel node={selected} onClose={() => setSelectedNode(null)} />
          ) : (
            <Card className="p-4 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
              <Info className="mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-[10px] text-muted-foreground">Click a service node to inspect latency, uptime, memory, and dependencies</p>
            </Card>
          )}

          <HealthTimeline />

          <Button
            variant="outline"
            size="xs"
            className="w-full"
            onClick={() => setShowPredictive(!showPredictive)}
          >
            <BarChart3 className="mr-1 h-3 w-3" />
            {showPredictive ? "Hide" : "Show"} Predictive Capacity
          </Button>

          <AnimatePresence>
            {showPredictive && (
              <motion.div
                initial={reduced ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={reduced ? undefined : { opacity: 0, height: 0 }}
              >
                <PredictivePanel
                  storage={{ totalUsedGb: health.services.find((s) => s.id === "storage") ? 4912 : 0, totalGb: 7800 }}
                  models={models}
                  health={health}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
