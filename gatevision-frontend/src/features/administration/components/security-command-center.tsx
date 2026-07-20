import { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Activity, AlertTriangle, Brain, BarChart3, Clock, Car,
  ScanEye, FileWarning, Sliders, TrendingUp, Users, Ban, UserCheck,
  Zap, History, Thermometer, Gauge, RefreshCw, Monitor, Camera,
  CheckCircle, XCircle, AlertOctagon, Printer, Download, ChevronRight,
  LayoutGrid, List, UserPlus, Wifi, WifiOff, Layers, GitPullRequest,
  MessageSquare, Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type {
  ManualReview, SecurityEvent, CommandMatrixData, AdminStats,
  SecurityScoreBreakdown, AdminInsight,
} from "../types";

interface Incident {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "pending" | "investigating" | "resolved";
  assignee: string;
  timestamp: string;
  notes: { author: string; text: string; time: string }[];
}

interface SCCProps {
  reviews: ManualReview[];
  events: SecurityEvent[];
  commandMatrix: CommandMatrixData;
  stats: AdminStats;
  securityScore: SecurityScoreBreakdown;
  insights: AdminInsight[];
  health?: { status: string } | null;
  models?: { id: string; name: string; status: string }[] | null;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "inc-1", title: "OCR Failure Spike", description: "Multiple OCR failures detected at North Gate camera", severity: "high", status: "pending", assignee: "Unassigned", timestamp: new Date(Date.now() - 1200000).toISOString(), notes: [],
  },
  {
    id: "inc-2", title: "Suspicious Vehicle Pattern", description: "Same plate denied entry 5 times in 10 minutes", severity: "critical", status: "investigating", assignee: "Sarah Chen", timestamp: new Date(Date.now() - 3600000).toISOString(), notes: [
      { author: "Sarah Chen", text: "Checking vehicle registry for matches", time: "30m ago" },
    ],
  },
  {
    id: "inc-3", title: "Camera Offline Alert", description: "South Gate outbound camera has been offline for 15 minutes", severity: "medium", status: "investigating", assignee: "Mike Park", timestamp: new Date(Date.now() - 5400000).toISOString(), notes: [
      { author: "Mike Park", text: "Camera power cycle initiated", time: "10m ago" },
    ],
  },
  {
    id: "inc-4", title: "Manual Review Backlog", description: "7 reviews pending — exceeding 5-review threshold", severity: "medium", status: "pending", assignee: "Unassigned", timestamp: new Date(Date.now() - 7200000).toISOString(), notes: [],
  },
  {
    id: "inc-5", title: "Processing Time Anomaly", description: "Average processing time spiked to 850ms (threshold: 500ms)", severity: "low", status: "resolved", assignee: "Alex Drake", timestamp: new Date(Date.now() - 14400000).toISOString(), notes: [
      { author: "Alex Drake", text: "Pipeline bottleneck identified — GPU memory limit reached", time: "2h ago" },
      { author: "Alex Drake", text: "Resolved by redistributing inference load", time: "1h ago" },
    ],
  },
];

function OperationsWall({
  reviews, events, commandMatrix, health, models,
}: {
  reviews: ManualReview[];
  events: SecurityEvent[];
  commandMatrix: CommandMatrixData;
  health?: { status: string } | null;
  models?: { id: string; name: string; status: string }[] | null;
}) {
  const criticalEvents = events.filter((e) => e.severity === "critical");
  const pendingReviews = reviews.filter((r) => r.status === "pending");

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card className="p-3 text-center">
        <UserCheck className="mx-auto mb-1 h-5 w-5 text-warning" />
        <p className="text-lg font-bold tabular-nums">{pendingReviews.length}</p>
        <p className="text-[9px] text-muted-foreground">Pending Reviews</p>
      </Card>
      <Card className="p-3 text-center">
        <Camera className={cn("mx-auto mb-1 h-5 w-5", health?.status === "healthy" ? "text-success" : "text-danger")} />
        <p className="text-lg font-bold tabular-nums">{commandMatrix.gatesOnline}</p>
        <p className="text-[9px] text-muted-foreground">Gates Online</p>
        {commandMatrix.gatesOffline > 0 && (
          <p className="text-[8px] text-danger mt-0.5">{commandMatrix.gatesOffline} offline</p>
        )}
      </Card>
      <Card className="p-3 text-center">
        <Activity className="mx-auto mb-1 h-5 w-5 text-primary" />
        <p className="text-lg font-bold tabular-nums">{commandMatrix.activeSessions}</p>
        <p className="text-[9px] text-muted-foreground">Active Sessions</p>
      </Card>
      <Card className="p-3 text-center">
        <Monitor className={cn("mx-auto mb-1 h-5 w-5", health?.status === "healthy" ? "text-success" : "text-danger")} />
        <p className="text-lg font-bold tabular-nums capitalize">{health?.status ?? "N/A"}</p>
        <p className="text-[9px] text-muted-foreground">System Health</p>
      </Card>
      <Card className="p-3 text-center">
        <Brain className={cn("mx-auto mb-1 h-5 w-5", (models?.length ?? 0) > 0 ? "text-success" : "text-muted")} />
        <p className="text-lg font-bold tabular-nums">{models?.length ?? 0}</p>
        <p className="text-[9px] text-muted-foreground">AI Models</p>
        {commandMatrix.modelsDegraded > 0 && (
          <p className="text-[8px] text-warning mt-0.5">{commandMatrix.modelsDegraded} degraded</p>
        )}
      </Card>
      <Card className="p-3 text-center">
        <AlertOctagon className="mx-auto mb-1 h-5 w-5 text-danger" />
        <p className="text-lg font-bold tabular-nums">{criticalEvents.length}</p>
        <p className="text-[9px] text-muted-foreground">Critical Alerts</p>
      </Card>
    </div>
  );
}

function IncidentBoard() {
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const prefersReduced = useReducedMotion();

  const columns = useMemo(() => [
    { id: "pending", label: "Pending", icon: AlertTriangle, color: "text-danger" },
    { id: "investigating", label: "Investigating", icon: Activity, color: "text-warning" },
    { id: "resolved", label: "Resolved", icon: CheckCircle, color: "text-success" },
  ] as const, []);

  const moveIncident = useCallback((id: string, newStatus: Incident["status"]) => {
    setIncidents((prev) => prev.map((inc) => inc.id === id ? { ...inc, status: newStatus } : inc));
  }, []);

  const addNote = useCallback((incidentId: string) => {
    if (!noteText.trim()) return;
    setIncidents((prev) => prev.map((inc) => inc.id === incidentId
      ? { ...inc, notes: [...inc.notes, { author: "Current User", text: noteText.trim(), time: "just now" }] }
      : inc));
    setNoteText("");
  }, [noteText]);

  const selected = incidents.find((i) => i.id === selectedIncident);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((col) => {
        const colIncidents = incidents.filter((i) => i.status === col.id);
        const colColor = col.color;
        const Icon = col.icon;
        return (
          <div key={col.id} className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Icon className={cn("h-3.5 w-3.5", colColor)} />
              {col.label}
              <Badge variant="neutral" size="sm" className="ml-auto text-[9px]">{colIncidents.length}</Badge>
            </div>
            <div className="space-y-2 min-h-[200px] rounded-lg bg-elevated/30 p-2">
              <AnimatePresence>
                {colIncidents.map((inc) => (
                  <motion.div
                    key={inc.id}
                    layout={!prefersReduced}
                    initial={prefersReduced ? undefined : { opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={prefersReduced ? undefined : { opacity: 0, scale: 0.95 }}
                    className={cn(
                      "rounded-lg border p-3 cursor-pointer transition-colors",
                      selectedIncident === inc.id ? "border-primary bg-primary/5" : "border-border bg-elevated hover:border-primary/30",
                    )}
                    onClick={() => setSelectedIncident(inc.id)}
                  >
                    <div className="flex items-start justify-between">
                      <Badge variant={inc.severity === "critical" ? "danger" : inc.severity === "high" ? "warning" : "info"} size="sm" className="text-[8px]">
                        {inc.severity}
                      </Badge>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveIncident(inc.id, inc.status === "pending" ? "investigating" : inc.status === "investigating" ? "resolved" : "pending"); }}
                        className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {inc.status === "pending" ? <ChevronRight className="h-3 w-3" /> : inc.status === "investigating" ? <CheckCircle className="h-3 w-3 text-success" /> : <RefreshCw className="h-3 w-3" />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs font-medium">{inc.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{inc.description}</p>
                    <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground/60">
                      <span>{inc.assignee}</span>
                      <span>{new Date(inc.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {inc.notes.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground/50">
                        <MessageSquare className="h-2.5 w-2.5" />
                        {inc.notes.length} note{inc.notes.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      {/* Detail Panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="lg:col-span-3"
            initial={prefersReduced ? undefined : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={selected.severity === "critical" ? "danger" : selected.severity === "high" ? "warning" : "info"}>{selected.severity}</Badge>
                  <h4 className="text-sm font-semibold">{selected.title}</h4>
                </div>
                <Button variant="ghost" size="icon-xs" onClick={() => setSelectedIncident(null)}>
                  <XCircle className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{selected.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground/70 mb-4">
                <span>Assignee: {selected.assignee}</span>
                <span>Status: {selected.status}</span>
                <span>Created: {new Date(selected.timestamp).toLocaleString()}</span>
              </div>

              <h5 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Collaboration Notes</h5>
              <div className="space-y-2 mb-3">
                {selected.notes.map((note, i) => (
                  <div key={i} className="rounded-lg bg-elevated/50 p-2">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
                      <span className="font-medium">{note.author}</span>
                      <span>{note.time}</span>
                    </div>
                    <p className="text-xs mt-0.5">{note.text}</p>
                  </div>
                ))}
                {selected.notes.length === 0 && (
                  <p className="text-xs text-muted-foreground/50">No notes yet</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs outline-none focus:border-primary"
                  onKeyDown={(e) => e.key === "Enter" && addNote(selected.id)}
                />
                <Button variant="secondary" size="xs" onClick={() => addNote(selected.id)} disabled={!noteText.trim()}>
                  <MessageSquare className="mr-1 h-3 w-3" /> Add
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RiskGauge({ score }: { score: SecurityScoreBreakdown }) {
  const prefersReduced = useReducedMotion();
  const overall = useMemo(() =>
    Math.round((score.mfaAdoption + score.failedLoginsScore + score.passwordStrength + score.activeSessionsScore + score.permissionHygiene + score.auditCompliance) / 6),
    [score],
  );

  const factors = useMemo(() => [
    { label: "MFA Adoption", value: score.mfaAdoption },
    { label: "Failed Logins", value: score.failedLoginsScore },
    { label: "Password Strength", value: score.passwordStrength },
    { label: "Active Sessions", value: score.activeSessionsScore },
    { label: "Permission Hygiene", value: score.permissionHygiene },
    { label: "Audit Compliance", value: score.auditCompliance },
  ], [score]);

  const gaugeColor = overall >= 80 ? "stroke-success" : overall >= 60 ? "stroke-warning" : "stroke-danger";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (overall / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" className="text-border" strokeWidth="6" />
        <motion.circle
          cx="40" cy="40" r="36" fill="none"
          className={gaugeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={prefersReduced ? undefined : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-xl font-bold tabular-nums"
          initial={prefersReduced ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {overall}
        </motion.span>
        <span className="text-[8px] text-muted-foreground">RISK SCORE</span>
      </div>
      <div className="mt-4 w-full space-y-1.5">
        {factors.map((f) => (
          <div key={f.label} className="flex items-center gap-2 text-[10px]">
            <span className="w-24 text-right text-muted-foreground truncate">{f.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: f.value >= 80 ? "var(--color-success)" : f.value >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}
                initial={prefersReduced ? undefined : { width: 0 }}
                animate={{ width: `${f.value}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
            <span className="w-8 text-right font-mono tabular-nums">{f.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExecutiveSnapshot({
  stats, commandMatrix, health, models, reviews,
}: {
  stats: AdminStats;
  commandMatrix: CommandMatrixData;
  health?: { status: string } | null;
  models?: { id: string; name: string; status: string }[] | null;
  reviews: ManualReview[];
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Operations Snapshot</title><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; padding: 40px; }
      h1 { font-size: 24px; margin-bottom: 4px; }
      h2 { font-size: 16px; margin: 20px 0 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
      .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
      .value { font-size: 20px; font-weight: 700; }
      .label { font-size: 11px; color: #64748b; }
      .critical { color: #dc2626; }
      .warning { color: #f59e0b; }
      .healthy { color: #22c55e; }
      .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
      .badge-ok { background: #dcfce7; color: #166534; }
      .badge-warn { background: #fef3c7; color: #92400e; }
      .badge-err { background: #fee2e2; color: #991b1b; }
    </style></head><body>
      <h1>GateVision Operations Snapshot</h1>
      <p style="color: #64748b; margin-bottom: 20px;">${new Date().toLocaleString()}</p>
      <h2>System Health</h2>
      <div class="grid">
        <div class="card"><div class="value ${health?.status === "healthy" ? "healthy" : "critical"}">${health?.status ?? "N/A"}</div><div class="label">System Status</div></div>
        <div class="card"><div class="value">${commandMatrix.gatesOnline}</div><div class="label">Gates Online</div></div>
        <div class="card"><div class="value">${commandMatrix.modelsHealthy}</div><div class="label">AI Models Healthy</div></div>
      </div>
      <h2>Operations</h2>
      <div class="grid">
        <div class="card"><div class="value">${stats.pendingReviews}</div><div class="label">Active Reviews</div></div>
        <div class="card"><div class="value">${stats.activeSessions}</div><div class="label">Active Sessions</div></div>
        <div class="card"><div class="value">${stats.securityEventsToday}</div><div class="label">Events Today</div></div>
      </div>
      <h2>AI Models</h2>
      <p>${models?.map((m) => `${m.name}: <span class="badge badge-${m.status === "healthy" ? "ok" : m.status === "degraded" ? "warn" : "err"}">${m.status}</span>`).join(" &nbsp;|&nbsp; ") ?? "N/A"}</p>
      <h2>Critical Alerts</h2>
      <p>${reviews.filter((r) => r.status === "pending").length} pending manual reviews</p>
      <div class="footer">Generated by GateVision Security Command Center &bull; ${new Date().toLocaleString()}</div>
    </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }, [health, commandMatrix, models, stats, reviews]);

  return (
    <div ref={printRef} className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold tabular-nums">{stats.totalUsers}</p>
          <p className="text-[9px] text-muted-foreground">Total Users</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold tabular-nums">{stats.pendingReviews}</p>
          <p className="text-[9px] text-muted-foreground">Active Reviews</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold tabular-nums">{commandMatrix.activeSessions}</p>
          <p className="text-[9px] text-muted-foreground">Active Sessions</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold tabular-nums">{stats.securityEventsToday}</p>
          <p className="text-[9px] text-muted-foreground">Events Today</p>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className={cn("h-2 w-2 rounded-full", health?.status === "healthy" ? "bg-success" : "bg-danger")} />
          System: <span className="font-medium capitalize">{health?.status ?? "N/A"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-success" />
          Models: <span className="font-medium">{commandMatrix.modelsHealthy}/{commandMatrix.modelsHealthy + commandMatrix.modelsDegraded} healthy</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-primary" />
          Processing: <span className="font-medium">{stats.permissionChanges} changes</span>
        </div>
      </div>

      <Button variant="outline" size="xs" onClick={handlePrint}>
        <Printer className="mr-1 h-3 w-3" /> Print Snapshot
      </Button>
    </div>
  );
}

export function SecurityCommandCenter({
  reviews, events, commandMatrix, stats, securityScore, insights,
  health, models, isLoading, isError, onRetry,
}: SCCProps) {
  const [activeView, setActiveView] = useState<string>("wall");

  if (isLoading) {
    return (
      <Card className="p-5 space-y-4">
        <div className="h-6 w-56 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-5 text-center">
        <AlertOctagon className="mx-auto mb-2 h-8 w-8 text-danger" />
        <p className="text-sm text-muted-foreground mb-2">Security Command Center failed to load</p>
        {onRetry && (
          <Button variant="outline" size="xs" onClick={onRetry}>
            <RefreshCw className="mr-1 h-3 w-3" /> Retry
          </Button>
        )}
      </Card>
    );
  }

  const VIEWS = [
    { id: "wall", label: "Operations Wall", icon: LayoutGrid },
    { id: "incidents", label: "Incident Board", icon: GitPullRequest },
    { id: "risk", label: "Risk Score", icon: Gauge },
    { id: "snapshot", label: "Executive Snapshot", icon: BarChart3 },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Security Command Center</h3>
          <Badge variant="info" size="sm" className="text-[9px]">SOC</Badge>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> LIVE
        </span>
      </div>

      {/* View Tabs */}
      <div className="flex gap-1">
        {VIEWS.map((view) => {
          const I = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeView === view.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-elevated hover:text-foreground",
              )}
            >
              <I className="h-3.5 w-3.5" />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {activeView === "wall" && (
            <OperationsWall reviews={reviews} events={events} commandMatrix={commandMatrix} health={health} models={models} />
          )}
          {activeView === "incidents" && <IncidentBoard />}
          {activeView === "risk" && (
            <Card className="p-5">
              <div className="relative flex flex-col items-center">
                <RiskGauge score={securityScore} />
              </div>
            </Card>
          )}
          {activeView === "snapshot" && (
            <ExecutiveSnapshot stats={stats} commandMatrix={commandMatrix} health={health} models={models} reviews={reviews} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
