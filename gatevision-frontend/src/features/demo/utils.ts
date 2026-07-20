import type { MetricsSnapshot } from "./types";

export function generateMetricsTick(previous?: MetricsSnapshot): MetricsSnapshot {
  return {
    entries: (previous?.entries ?? 0) + Math.floor(Math.random() * 3),
    exits: (previous?.exits ?? 0) + Math.floor(Math.random() * 2),
    denied: (previous?.denied ?? 0) + (Math.random() > 0.8 ? 1 : 0),
    manualReviews: (previous?.manualReviews ?? 0) + (Math.random() > 0.85 ? 1 : 0),
    incidents: (previous?.incidents ?? 0) + (Math.random() > 0.95 ? 1 : 0),
    avgProcessingTime: Math.floor(Math.random() * 400 + 400),
    throughput: Math.floor(Math.random() * 8 + 4),
    timestamp: new Date().toISOString(),
  };
}

export function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPercent(p: number): string {
  return `${p.toFixed(1)}%`;
}

export function getConfidenceColor(pct: number): string {
  if (pct >= 90) return "text-success";
  if (pct >= 70) return "text-warning";
  return "text-danger";
}

export function getConfidenceBg(pct: number): string {
  if (pct >= 90) return "bg-success";
  if (pct >= 70) return "bg-warning";
  return "bg-danger";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "success": case "granted": case "safe": return "text-success";
    case "warning": case "denied": case "review": return "text-warning";
    case "fail": case "critical": case "override": return "text-danger";
    default: return "text-muted-foreground";
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case "success": case "granted": case "safe": return "bg-success/10 border-success/20";
    case "warning": case "denied": case "review": return "bg-warning/10 border-warning/20";
    case "fail": case "critical": case "override": return "bg-danger/10 border-danger/20";
    default: return "bg-border/30";
  }
}
