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

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}

export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, "0")}:00`;
}
