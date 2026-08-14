import { formatHour } from "../utils";
import type {
  ApiReportRecord, ApiAnalyticsSummary,
  ApiManualReviewSummary,
} from "./types";

export function mapReportRecord(r: ApiReportRecord) {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    status: r.status,
    format: r.format,
    sizeKb: r.size_kb,
    rows: r.rows,
    columns: (r.columns ?? []).map((c) => ({
      key: c.key,
      label: c.label,
      type: c.type,
      sortable: c.sortable,
      filterable: c.filterable,
    })),
    data: r.data ?? [],
    filters: r.filters ?? {},
    createdBy: r.created_by,
  };
}

export function mapAnalyticsSummary(a: ApiAnalyticsSummary) {
  const hourlyTraffic = (a.hourly_traffic ?? []).map((h) => ({
    hour: formatHour(h.hour),
    entries: h.count,
    exits: 0,
  }));

  const breakdown = a.decision_breakdown;
  const decisionBreakdown: {
    type: "granted" | "denied" | "manual_review";
    count: number;
    percentage: number;
  }[] = [];
  if (breakdown) {
    decisionBreakdown.push({
      type: "granted",
      count: breakdown.grants,
      percentage: Math.round((breakdown.grant_rate ?? 0) * 100),
    });
    decisionBreakdown.push({
      type: "denied",
      count: breakdown.denials,
      percentage: Math.round((breakdown.denial_rate ?? 0) * 100),
    });
    decisionBreakdown.push({
      type: "manual_review",
      count: breakdown.manual_reviews,
      percentage: Math.round((breakdown.review_rate ?? 0) * 100),
    });
  }

  const processing = a.processing_times;

  const gateComparison: {
    gateId: string;
    gateName: string;
    entries: number;
    exits: number;
    avgWaitSec: number;
    utilizationPct: number;
  }[] = [];
  const vehicleDistribution: { type: string; count: number }[] = [];
  const manualReviewTrend: { date: string; count: number; resolved: number; pending: number }[] = [];

  return {
    hourlyTraffic,
    dailyTrends: (a.daily_trend ?? []).map((d) => ({
      date: d._id,
      entries: d.entries,
      exits: d.exits,
      total: d.count,
    })),
    decisionBreakdown,
    processingMetrics: {
      avgProcessingTimeMs: processing?.avg_processing_time_ms ?? 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
      throughputPerSecond: 0,
    },
    denialTrends: [],
    recognitionStats: {
      plateAccuracy: 0,
      ocrAccuracy: 0,
      faceAccuracy: 0,
      vehicleAccuracy: 0,
      totalProcessed: 0,
      avgConfidence: 0,
    },
    peakHours: hourlyTraffic,
    gateComparison,
    vehicleDistribution,
    manualReviewTrend,
  };
}

export function mapManualReviewSummary(m: ApiManualReviewSummary) {
  return {
    id: m.id,
    plate: m.plate,
    driver: m.driver,
    vehicle: m.vehicle,
    reason: m.reason,
    confidence: m.confidence,
    status: m.status,
    createdAt: m.created_at,
    resolvedAt: m.resolved_at,
    resolvedBy: m.resolved_by,
  };
}
