import type {
  DashboardMetrics, ActivityEvent, RecentDecision, HourlyFlow,
  SystemModule, GateStatus, AIStatus, Incident,
} from "../types";
import type {
  ApiDashboardMetrics, ApiDashboardActivity, ApiRecentDecision,
  ApiHourlyFlow, ApiModelHealth, ApiGateInfo, ApiSystemEvent,
  ApiDecisionHistoryItem, ApiRecognitionHistoryItem, ApiDecisionStage,
  ApiRecognitionStage,
} from "../types/api";

export function mapDashboardMetrics(m: ApiDashboardMetrics): DashboardMetrics {
  const mt = m.metrics;
  return {
    vehiclesProcessed: mt.total_vehicles,
    entries: mt.entries_today,
    exits: mt.exits_today,
    denied: mt.denial_count,
    manualReviews: mt.manual_review_count,
    avgProcessingTime: mt.avg_processing_time_ms,
    recognitionAccuracy: Math.round((1 - mt.denial_rate) * 10000) / 100,
    peakHour: m.peak_entry_hours[0]?.hour ?? "N/A",
  };
}

export function mapActivityEvent(a: ApiDashboardActivity | ApiSystemEvent): ActivityEvent {
  return {
    id: a.id,
    type: a.type as ActivityEvent["type"],
    message: a.message,
    timestamp: a.timestamp,
    plate: a.plate,
    confidence: a.confidence,
  };
}

export function mapRecentDecision(d: ApiRecentDecision): RecentDecision {
  return {
    id: d.id,
    plate: d.plate,
    driver: d.driver,
    vehicle: d.vehicle,
    decision: d.decision,
    confidence: d.confidence,
    timestamp: d.timestamp,
    processingTime: d.processing_time,
  };
}

export function mapHourlyFlow(h: ApiHourlyFlow): HourlyFlow {
  return {
    hour: h.hour,
    label: h.hour,
    value: h.total,
    entries: h.entries,
    exits: h.exits,
  };
}

export function mapModelHealth(m: ApiModelHealth, mapIndex: number): SystemModule {
  return {
    id: m.id || `mod-${mapIndex}`,
    name: m.name,
    status: m.status === "healthy" ? "healthy" : m.status === "degraded" ? "degraded" : "unhealthy",
    latency: m.avg_latency_ms,
    lastHeartbeat: m.last_loaded,
    version: m.version,
  };
}

export function mapGateInfo(g: ApiGateInfo): GateStatus {
  return {
    id: g.id,
    name: g.name,
    isOpen: g.barrier === "up",
    barrier: g.barrier as GateStatus["barrier"],
    sensorState: g.sensor_state as GateStatus["sensorState"],
    currentVehicle: g.current_vehicle,
    operator: g.operator,
    connection: g.connection as GateStatus["connection"],
    lastActivity: g.last_activity,
  };
}

export function mapModelsToAIStatus(models: ApiModelHealth[]): AIStatus {
  const safe = Array.isArray(models) ? models : [];
  const withData = safe.filter((m) => m.inference_count > 0);
  const avgConfidence = withData.length > 0
    ? withData.reduce((s, m) => s + (100 - m.error_count * 5), 0) / withData.length
    : 0;
  return {
    detectionAccuracy: Math.min(99.9, Math.max(0, avgConfidence)),
    modelsLoaded: safe.filter((m) => m.status === "healthy").length,
    totalModels: safe.length,
    avgDecisionTime: safe.length > 0
      ? Math.round(safe.reduce((s, m) => s + m.avg_latency_ms, 0) / safe.length)
      : 0,
    confidence: Math.min(99.9, Math.max(0, avgConfidence)),
  };
}

export function mapDecisionHistoryToRecent(d: ApiDecisionHistoryItem): RecentDecision {
  return {
    id: d.id,
    plate: d.plate,
    driver: d.driver,
    vehicle: d.vehicle,
    decision: d.decision,
    confidence: d.confidence,
    timestamp: d.timestamp,
    processingTime: d.processing_ms,
  };
}

export function mapApiStage(s: ApiDecisionStage | ApiRecognitionStage) {
  return {
    stage: s.stage,
    status: s.status as "pending" | "active" | "completed" | "failed",
    label: s.label,
    detail: s.detail,
    confidence: s.confidence,
    timestamp: s.timestamp,
  };
}
