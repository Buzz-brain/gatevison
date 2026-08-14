import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CircleOff,
  type LucideIcon,
} from "lucide-react";
import type { HealthStatus, StatusConfigEntry } from "./types";

export const STATUS_CONFIG: Record<HealthStatus, StatusConfigEntry> = {
  healthy: { label: "Healthy", hex: "#22c55e", icon: CheckCircle2 },
  degraded: { label: "Degraded", hex: "#f59e0b", icon: AlertTriangle },
  unhealthy: { label: "Unhealthy", hex: "#ef4444", icon: XCircle },
  down: { label: "Down", hex: "#6b7280", icon: CircleOff },
};
