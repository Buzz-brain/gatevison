import type { ApiDecisionHistoryItem } from "@/features/dashboard/types/api";
import type {
  ApiReportRecord, ApiAnalyticsSummary, ApiHourlyTraffic, ApiDailyTrendData,
  ApiDecisionBreakdownData, ApiProcessingMetrics, ApiDenialTrend,
  ApiRecognitionStatistics, ApiPeakHourData, ApiGateComparison,
  ApiVehicleDistribution, ApiManualReviewTrend, ApiSearchResult,
  ApiManualReviewSummary, ApiEventSummary,
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
  return {
    hourlyTraffic: (a.hourly_traffic ?? []).map(mapHourlyTraffic),
    dailyTrends: (a.daily_trends ?? []).map(mapDailyTrend),
    decisionBreakdown: (a.decision_breakdown ?? []).map(mapDecisionBreakdown),
    processingMetrics: mapProcessingMetrics(a.processing_metrics),
    denialTrends: (a.denial_trends ?? []).map(mapDenialTrend),
    recognitionStats: mapRecognitionStats(a.recognition_statistics),
    peakHours: (a.peak_hours ?? []).map(mapPeakHour),
    gateComparison: (a.gate_comparison ?? []).map(mapGateComparison),
    vehicleDistribution: (a.vehicle_distribution ?? []).map(mapVehicleDistribution),
    manualReviewTrend: (a.manual_review_trend ?? []).map(mapManualReviewTrend),
  };
}

function mapHourlyTraffic(h: ApiHourlyTraffic) {
  return { hour: h.hour, entries: h.entries, exits: h.exits };
}

function mapDailyTrend(d: ApiDailyTrendData) {
  return { date: d.date, entries: d.entries, exits: d.exits, total: d.total };
}

function mapDecisionBreakdown(d: ApiDecisionBreakdownData) {
  return { type: d.type as "granted" | "denied" | "manual_review" | "emergency" | "unknown", count: d.count, percentage: d.percentage };
}

function mapProcessingMetrics(p: ApiProcessingMetrics) {
  return {
    avgProcessingTimeMs: p.avg_processing_time_ms,
    p50Ms: p.p50_ms,
    p95Ms: p.p95_ms,
    p99Ms: p.p99_ms,
    throughputPerSecond: p.throughput_per_second,
  };
}

function mapDenialTrend(d: ApiDenialTrend) {
  return { date: d.date, count: d.count, reason: d.reason };
}

function mapRecognitionStats(r: ApiRecognitionStatistics) {
  return {
    plateAccuracy: r.plate_accuracy,
    ocrAccuracy: r.ocr_accuracy,
    faceAccuracy: r.face_accuracy,
    vehicleAccuracy: r.vehicle_accuracy,
    totalProcessed: r.total_processed,
    avgConfidence: r.avg_confidence,
  };
}

function mapPeakHour(p: ApiPeakHourData) {
  return { hour: p.hour, entries: p.entries, exits: p.exits };
}

function mapGateComparison(g: ApiGateComparison) {
  return {
    gateId: g.gate_id,
    gateName: g.gate_name,
    entries: g.entries,
    exits: g.exits,
    avgWaitSec: g.avg_wait_sec,
    utilizationPct: g.utilization_pct,
  };
}

function mapVehicleDistribution(v: ApiVehicleDistribution) {
  return { type: v.type, count: v.count };
}

function mapManualReviewTrend(m: ApiManualReviewTrend) {
  return { date: m.date, count: m.count, resolved: m.resolved, pending: m.pending };
}

export function mapSearchResult(s: ApiSearchResult) {
  return {
    id: s.id,
    type: s.type,
    label: s.label,
    description: s.description,
    score: s.score,
    metadata: s.metadata,
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

export function mapEventSummary(e: ApiEventSummary) {
  return {
    id: e.id,
    type: e.type,
    message: e.message,
    severity: e.severity,
    timestamp: e.timestamp,
    source: e.source,
    metadata: e.metadata,
  };
}

export function mapDecisionHistoryItem(d: ApiDecisionHistoryItem) {
  return {
    id: d.id,
    plate: d.plate,
    driver: d.driver,
    vehicle: d.vehicle,
    decision: d.decision,
    confidence: d.confidence,
    timestamp: d.timestamp,
    processingMs: d.processing_ms,
    stages: (d.stages ?? []).map((s) => ({
      stage: s.stage,
      status: s.status,
      label: s.label,
      detail: s.detail,
      confidence: s.confidence,
      timestamp: s.timestamp,
    })),
  };
}
