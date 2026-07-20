import type {
  GateStatus, RecognitionStatus, DecisionResult, HealthState, EmergencyAction, ActivityKind,
} from "./types";

export const gateStatusConfig: Record<GateStatus, { label: string; variant: "success" | "warning" | "danger" | "neutral" | "info"; color: string }> = {
  open: { label: "OPEN", variant: "success", color: "text-success" },
  closed: { label: "CLOSED", variant: "neutral", color: "text-muted-foreground" },
  processing: { label: "PROCESSING", variant: "warning", color: "text-warning" },
  blocked: { label: "BLOCKED", variant: "danger", color: "text-danger" },
  maintenance: { label: "MAINTENANCE", variant: "info", color: "text-info" },
};

export const recognitionConfig: Record<RecognitionStatus, { label: string; variant: "success" | "warning" | "danger" | "neutral" | "info"; color: string }> = {
  pending: { label: "Pending", variant: "neutral", color: "text-muted-foreground" },
  recognizing: { label: "Recognizing", variant: "info", color: "text-info" },
  recognized: { label: "Recognized", variant: "success", color: "text-success" },
  manual_review: { label: "Manual Review", variant: "warning", color: "text-warning" },
  denied: { label: "Denied", variant: "danger", color: "text-danger" },
};

export const decisionConfig: Record<DecisionResult, { label: string; variant: "success" | "danger" | "warning"; color: string }> = {
  granted: { label: "GRANTED", variant: "success", color: "text-success" },
  denied: { label: "DENIED", variant: "danger", color: "text-danger" },
  manual_review: { label: "MANUAL REVIEW", variant: "warning", color: "text-warning" },
};

export const healthConfig: Record<HealthState, { label: string; color: string; dot: string }> = {
  healthy: { label: "Healthy", color: "text-success", dot: "bg-success" },
  degraded: { label: "Degraded", color: "text-warning", dot: "bg-warning" },
  offline: { label: "Offline", color: "text-danger", dot: "bg-danger" },
};

export const emergencyConfig: Record<EmergencyAction, { label: string; description: string; variant: "destructive" | "warning" | "success" | "outline" }> = {
  force_open: { label: "Force Open", description: "Override and raise all barriers immediately", variant: "destructive" },
  lock_gate: { label: "Lock Gate", description: "Prevent any barrier movement", variant: "warning" },
  fire_mode: { label: "Fire Mode", description: "Open all gates for evacuation", variant: "destructive" },
  maintenance: { label: "Maintenance", description: "Take gate offline for service", variant: "outline" },
  emergency_vehicle: { label: "Emergency Vehicle", description: "Priority fast-lane access", variant: "success" },
};

export const activityConfig: Record<ActivityKind, { color: string; icon: string }> = {
  detected: { color: "text-info", icon: "ScanLine" },
  recognized: { color: "text-success", icon: "UserCheck" },
  decision: { color: "text-primary", icon: "ShieldCheck" },
  opened: { color: "text-success", icon: "ArrowUpDown" },
  entered: { color: "text-success", icon: "LogIn" },
  exited: { color: "text-muted-foreground", icon: "LogOut" },
  alert: { color: "text-warning", icon: "AlertTriangle" },
};

export function confidenceColor(c: number): string {
  if (c >= 90) return "text-success";
  if (c >= 70) return "text-warning";
  return "text-danger";
}

export function formatClock(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatEta(sec: number): string {
  if (sec <= 0) return "Arriving";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
