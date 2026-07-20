import type { RoleId, UserStatus, Severity, ReviewDecision, NotificationChannel, DepartmentId, AdminUser } from "./types";

export const ROLE_CONFIG: Record<RoleId, { label: string; color: string; riskLevel: string }> = {
  admin: { label: "Administrator", color: "#ef4444", riskLevel: "critical" },
  security_officer: { label: "Security Officer", color: "#f59e0b", riskLevel: "high" },
  supervisor: { label: "Supervisor", color: "#3b82f6", riskLevel: "medium" },
  auditor: { label: "Auditor", color: "#8b5cf6", riskLevel: "low" },
  operator: { label: "Operator", color: "#22c55e", riskLevel: "low" },
  viewer: { label: "Viewer", color: "#6b7280", riskLevel: "low" },
};

export const STATUS_CONFIG: Record<UserStatus, { label: string; variant: string }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "neutral" },
  locked: { label: "Locked", variant: "danger" },
  suspended: { label: "Suspended", variant: "warning" },
  pending: { label: "Pending", variant: "info" },
};

export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; variant: string }> = {
  critical: { label: "Critical", color: "#ef4444", variant: "danger" },
  warning: { label: "Warning", color: "#f59e0b", variant: "warning" },
  info: { label: "Info", color: "#3b82f6", variant: "info" },
  resolved: { label: "Resolved", color: "#22c55e", variant: "success" },
};

export const REVIEW_CONFIG: Record<ReviewDecision, { label: string; variant: string }> = {
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
  escalated: { label: "Escalated", variant: "warning" },
  pending: { label: "Pending", variant: "info" },
};

export const DEPARTMENT_CONFIG: Record<DepartmentId, { label: string; color: string }> = {
  security: { label: "Security", color: "#ef4444" },
  operations: { label: "Operations", color: "#3b82f6" },
  facilities: { label: "Facilities", color: "#22c55e" },
  it: { label: "IT", color: "#8b5cf6" },
  management: { label: "Management", color: "#f59e0b" },
  legal: { label: "Legal", color: "#06b6d4" },
  hr: { label: "HR", color: "#ec4899" },
  parking: { label: "Parking", color: "#6b7280" },
};

export const CHANNEL_CONFIG: Record<NotificationChannel, { label: string; icon: string }> = {
  email: { label: "Email", icon: "mail" },
  sms: { label: "SMS", icon: "message-square" },
  push: { label: "Push", icon: "bell" },
  in_app: { label: "In-App", icon: "smartphone" },
};

export function formatTimestamp(ts: string): string {
  try { return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return ts; }
}

export function formatTime(ts: string): string {
  try { return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ts; }
}

export function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function relativeTime(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function initials(name: string): string {
  const parts = name.split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function getInitialsColor(id: string): string {
  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length]!;
}
