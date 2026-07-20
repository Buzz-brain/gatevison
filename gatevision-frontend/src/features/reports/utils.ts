import {
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Car,
  Clock,
  CloudRain,
  HelpCircle,
  Info,
  LogIn,
  LogOut,
  Moon,
  ScanEye,
  ShieldX,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  DecisionBreakdown,
  PeriodKey,
  SeverityLevel,
} from "./types";

export const CHART = {
  primary: "var(--color-primary)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  muted: "var(--color-muted-foreground)",
  border: "var(--color-border)",
  foreground: "var(--color-foreground)",
  grid: "rgba(148, 163, 184, 0.12)",
  palette: [
    "var(--color-primary)",
    "var(--color-success)",
    "var(--color-warning)",
    "var(--color-danger)",
    "#a78bfa",
    "#22d3ee",
    "#f472b6",
    "#facc15",
  ],
} as const;

export const ICON_MAP: Record<string, LucideIcon> = {
  "log-in": LogIn,
  "log-out": LogOut,
  car: Car,
  timer: Clock,
  "scan-eye": ScanEye,
  "shield-x": ShieldX,
  "user-check": UserCheck,
  clock: Clock,
  "trending-up": TrendingUp,
  "cloud-rain": CloudRain,
  "alert-octagon": AlertOctagon,
  moon: Moon,
  calendar: Calendar,
  users: Users,
  "alert-triangle": AlertTriangle,
  "help-circle": HelpCircle,
  info: Info,
};

export function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Info;
}

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
  month: "This Month",
  custom: "Custom Range",
};

export const DECISION_CONFIG: Record<
  DecisionBreakdown["type"],
  { label: string; color: string }
> = {
  granted: { label: "Granted", color: CHART.success },
  denied: { label: "Denied", color: CHART.danger },
  manual_review: { label: "Manual Review", color: CHART.warning },
  emergency: { label: "Emergency", color: "#a78bfa" },
  unknown: { label: "Unknown", color: CHART.muted },
};

export const SEVERITY_CONFIG: Record<
  SeverityLevel,
  { label: string; variant: "success" | "warning" | "danger"; hex: string }
> = {
  low: { label: "Low", variant: "success", hex: CHART.success },
  medium: { label: "Medium", variant: "warning", hex: CHART.warning },
  high: { label: "High", variant: "danger", hex: CHART.danger },
  critical: { label: "Critical", variant: "danger", hex: "#dc2626" },
};

export const RISK_LEVEL_CONFIG: Record<
  SeverityLevel,
  { label: string; hex: string }
> = {
  low: { label: "LOW", hex: CHART.success },
  medium: { label: "MEDIUM", hex: CHART.warning },
  high: { label: "HIGH", hex: CHART.danger },
  critical: { label: "CRITICAL", hex: "#dc2626" },
};

export const TONE_CONFIG = {
  positive: { hex: CHART.success, label: "Positive" },
  warning: { hex: CHART.warning, label: "Watch" },
  critical: { hex: CHART.danger, label: "Critical" },
} as const;

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}

export function formatClock(date?: Date): string {
  const d = date ?? new Date();
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function densityColor(density: number): string {
  const d = Math.max(0, Math.min(100, density));
  if (d < 25) return "rgba(34, 197, 94, 0.55)";
  if (d < 50) return "rgba(245, 158, 11, 0.6)";
  if (d < 75) return "rgba(249, 115, 22, 0.65)";
  return "rgba(239, 68, 68, 0.7)";
}

export function densityLabel(density: number): string {
  const d = Math.max(0, Math.min(100, density));
  if (d < 25) return "Quiet";
  if (d < 50) return "Moderate";
  if (d < 75) return "Busy";
  return "Congested";
}
