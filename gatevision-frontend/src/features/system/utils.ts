import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CircleOff,
  Wifi,
  WifiOff,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import type { HealthStatus, StatusConfigEntry, CameraStatus, AlertSeverity, LogLevel } from "./types";

export const STATUS_CONFIG: Record<HealthStatus, StatusConfigEntry> = {
  healthy: { label: "Healthy", hex: "#22c55e", icon: CheckCircle2 },
  degraded: { label: "Degraded", hex: "#f59e0b", icon: AlertTriangle },
  unhealthy: { label: "Unhealthy", hex: "#ef4444", icon: XCircle },
  down: { label: "Down", hex: "#6b7280", icon: CircleOff },
};

export const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; hex: string; variant: string }> = {
  critical: { label: "Critical", hex: "#ef4444", variant: "danger" },
  warning: { label: "Warning", hex: "#f59e0b", variant: "warning" },
  info: { label: "Info", hex: "#3b82f6", variant: "info" },
  resolved: { label: "Resolved", hex: "#6b7280", variant: "neutral" },
};

export const CAMERA_STATUS_CONFIG: Record<CameraStatus, { label: string; icon: LucideIcon }> = {
  online: { label: "Online", icon: Wifi },
  offline: { label: "Offline", icon: WifiOff },
  degraded: { label: "Degraded", icon: RefreshCw },
  reconnecting: { label: "Reconnecting", icon: RefreshCw },
};

export function formatUptime(ms: number): string {
  if (ms < 0) return "0m";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function getMetricColor(id: string, value: number): string {
  if (id === "cpu" || id === "memory" || id === "gpu" || id === "temperature") {
    if (value >= 85) return "#ef4444";
    if (value >= 70) return "#f59e0b";
    return "#22c55e";
  }
  if (id === "disk") {
    if (value >= 90) return "#ef4444";
    if (value >= 80) return "#f59e0b";
    return "#22c55e";
  }
  return "#3b82f6";
}

export function formatInferenceCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function formatLogTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

export function logLevelColor(level: LogLevel): string {
  switch (level) {
    case "error": return "#ef4444";
    case "warn": return "#f59e0b";
    case "info": return "#3b82f6";
    case "debug": return "#6b7280";
  }
}
