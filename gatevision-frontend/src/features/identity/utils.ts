import type { IdentityStatus, VehicleStatus, PolicyType, DocumentType } from "./types";

export const statusConfig: Record<IdentityStatus, { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" | "default"; dot: string }> = {
  verified: { label: "Verified", variant: "success", dot: "bg-success" },
  pending: { label: "Pending", variant: "warning", dot: "bg-warning" },
  visitor: { label: "Visitor", variant: "info", dot: "bg-info" },
  vip: { label: "VIP", variant: "default", dot: "bg-primary" },
  expired: { label: "Expired", variant: "neutral", dot: "bg-muted-foreground" },
  suspended: { label: "Suspended", variant: "danger", dot: "bg-danger" },
  inactive: { label: "Inactive", variant: "neutral", dot: "bg-muted-foreground" },
};

export const vehicleStatusConfig: Record<VehicleStatus, { label: string; variant: "success" | "warning" | "danger" | "neutral"; }> = {
  active: { label: "Active", variant: "success" },
  inactive: { label: "Inactive", variant: "neutral" },
  expired: { label: "Expired", variant: "warning" },
  flagged: { label: "Flagged", variant: "danger" },
};

export const policyTypeConfig: Record<PolicyType, { label: string; color: string; bg: string; border: string }> = {
  employee: { label: "Employee", color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  visitor: { label: "Visitor", color: "text-info", bg: "bg-info/10", border: "border-info/30" },
  contractor: { label: "Contractor", color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  vip: { label: "VIP", color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
  emergency: { label: "Emergency", color: "text-danger", bg: "bg-danger/10", border: "border-danger/30" },
};

export const documentConfig: Record<DocumentType, { label: string; icon: string }> = {
  driver_id: { label: "Driver ID", icon: "IdCard" },
  license: { label: "License", icon: "FileText" },
  insurance: { label: "Insurance", icon: "ShieldCheck" },
  registration: { label: "Registration", icon: "FileCheck" },
};

export function initials(name: string): string {
  return name.split(" ").map((n) => n[0] ?? "").slice(0, 2).join("").toUpperCase();
}

export function formatDate(iso: string): string {
  if (iso === "—") return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatRelative(iso: string): string {
  if (iso === "—") return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
