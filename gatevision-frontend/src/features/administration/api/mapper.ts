import type {
  ApiDashboardSummary, ApiAdminMetrics, ApiAdminActivity, ApiRecentDecision,
  ApiManualReview, ApiSystemEvent, ApiPerformanceMetrics,
} from "./types";
import type { ApiSystemHealth, ApiModelHealth } from "@/features/system/api/types";
import type {
  AdminStats, ManualReview, SecurityEvent, AuditEntry, ActivityEntry, CommandMatrixData,
} from "../types";

export function mapAdminMetrics(m: ApiAdminMetrics): AdminStats {
  return {
    totalUsers: 0,
    onlineUsers: 0,
    admins: 0,
    securityOfficers: 0,
    pendingReviews: m.manual_reviews,
    securityEventsToday: 0,
    failedLogins: 0,
    activeSessions: 0,
    permissionChanges: 0,
  };
}

export function mapActivityEntry(a: ApiAdminActivity): ActivityEntry {
  return {
    id: a.id,
    time: a.timestamp,
    action: a.type,
    detail: a.message,
    user: "",
    type: a.type as ActivityEntry["type"],
  };
}

export function mapManualReview(r: ApiManualReview): ManualReview {
  return {
    id: r.id,
    plate: r.plate,
    driverName: r.driver_name,
    vehicle: r.vehicle,
    reason: r.reason,
    confidence: r.confidence,
    timestamp: r.timestamp,
    status: r.status as ManualReview["status"],
    reviewer: r.reviewer,
    notes: r.notes,
    capturedImage: "",
    registeredImage: "",
    ocrConfidence: r.ocr_confidence,
    faceConfidence: r.face_confidence,
    vehicleConfidence: r.vehicle_confidence,
  };
}

export function mapSecurityEvent(e: ApiSystemEvent): SecurityEvent {
  return {
    id: e.id,
    type: e.type,
    title: e.title,
    description: e.description,
    severity: e.severity as SecurityEvent["severity"],
    timestamp: e.timestamp,
    user: e.user,
    module: e.module,
    acknowledged: e.acknowledged,
    assignee: e.assignee,
  };
}

export function mapAuditEntryFromEvent(e: ApiSystemEvent): AuditEntry {
  return {
    id: e.id,
    user: e.user ?? "system",
    action: e.type,
    target: e.module,
    detail: e.description,
    timestamp: e.timestamp,
    result: e.severity === "critical" ? "failure" : e.severity === "warning" ? "warning" : "success",
    ip: "",
    device: "",
    requestId: "",
    module: e.module,
    severity: e.severity as AuditEntry["severity"],
  };
}

export function mapCommandMatrix(
  metrics: ApiAdminMetrics | null,
  health: ApiSystemHealth | null,
  models: ApiModelHealth[] | null,
  reviewsCount: number,
): CommandMatrixData {
  const modelsHealthy = models?.filter((m) => m.status === "healthy").length ?? 0;
  const modelsDegraded = models?.filter((m) => m.status !== "healthy").length ?? 0;
  return {
    liveUsers: 0,
    activeSessions: 0,
    pendingReviews: reviewsCount,
    criticalEvents: 0,
    gatesOnline: health?.status === "healthy" ? 5 : 3,
    gatesOffline: health?.status === "healthy" ? 0 : 2,
    modelsHealthy,
    modelsDegraded,
    roleDistribution: [],
    privilegedUsers: [],
    recentEvents: [],
  };
}
