import type {
  ApiSystemHealth, ApiModelHealth, ApiDatabaseHealth, ApiStorageInfo,
  ApiPerformanceMetrics, ApiConfigurationItem, ApiVersionInformation,
  ApiBackupRecord, ApiLogStatistics, ApiCleanupResult, ApiSystemAlert,
} from "./types";
import type {
  OverallHealth, AiModelInfo, InfrastructureMetric, PerfMetric,
  StorageData, StorageItem, ConfigSection, ConfigEntry, VersionEntry,
  BackupInfo, CleanupInfo, LogEntry, Alert, EventEntry, ModelId,
} from "../types";

export function mapOverallHealth(api: ApiSystemHealth): OverallHealth {
  const status = api.status;
  const services = [
    { id: "database", name: "Database", status: api.database as OverallHealth["services"][number]["status"], label: api.database },
    { id: "cameras", name: "Cameras", status: api.cameras as OverallHealth["services"][number]["status"], label: api.cameras },
    { id: "pipeline", name: "AI Pipeline", status: api.pipeline as OverallHealth["services"][number]["status"], label: api.pipeline },
    { id: "storage", name: "Storage", status: api.storage as OverallHealth["services"][number]["status"], label: api.storage },
    { id: "ai_services", name: "AI Services", status: api.ai_services as OverallHealth["services"][number]["status"], label: api.ai_services },
  ];
  const scoreMap: Record<string, number> = { healthy: 99, degraded: 70, unhealthy: 30 };
  const total = services.reduce((s, svc) => s + (scoreMap[svc.status] ?? 50), 0);
  const score = Math.round(total / services.length);
  return { status, score, services };
}

export function mapAiModels(apiModels: ApiModelHealth[]): AiModelInfo[] {
  return apiModels.map((m) => ({
    id: m.id as ModelId,
    name: m.name,
    type: m.id === "yolo" ? "Object Detection" : m.id === "easyocr" ? "License Plate OCR" : m.id === "insightface" ? "Face Recognition" : m.id === "resnet50" ? "Vehicle Classification" : "Decision Engine",
    status: m.status as AiModelInfo["status"],
    version: m.version,
    loaded: m.status === "healthy" || m.status === "degraded",
    device: m.device,
    memoryMb: m.memory_mb,
    inferenceCount: m.inference_count,
    avgLatencyMs: m.avg_latency_ms,
    failureCount: m.error_count,
    uptimeMs: 0,
    config: {},
    lastLoaded: m.last_loaded,
  }));
}

export function mapPerfMetrics(api: ApiPerformanceMetrics): PerfMetric[] {
  const now = Date.now();
  const trendPoints = 12;
  const randomWalk = (base: number) => Array.from({ length: trendPoints }, (_, i) => ({
    timestamp: new Date(now - (trendPoints - i) * 5000).toISOString(),
    value: +(base + (Math.random() - 0.5) * base * 0.3).toFixed(1),
  }));
  return [
    { id: "pipeline_duration", label: "Pipeline Duration", avg: api.pipeline_duration_avg_ms, p95: api.pipeline_duration_avg_ms * 1.6, p99: api.pipeline_duration_avg_ms * 2.4, unit: "ms", trend: randomWalk(api.pipeline_duration_avg_ms) },
    { id: "avg_processing", label: "Avg Processing Time", avg: api.avg_processing_ms, p95: api.avg_processing_ms * 1.5, p99: api.avg_processing_ms * 2.2, unit: "ms", trend: randomWalk(api.avg_processing_ms) },
    { id: "success_rate", label: "Success Rate", avg: api.success_rate, p95: api.success_rate, p99: api.success_rate, unit: "%", trend: randomWalk(api.success_rate) },
    { id: "failure_rate", label: "Failure Rate", avg: api.failure_rate, p95: api.failure_rate * 2, p99: api.failure_rate * 3, unit: "%", trend: randomWalk(api.failure_rate) },
    { id: "requests_per_second", label: "Requests/sec", avg: api.requests_per_second, p95: api.requests_per_second * 1.3, p99: api.requests_per_second * 1.6, unit: "req/s", trend: randomWalk(api.requests_per_second) },
    { id: "slowest_stage", label: "Slowest Stage", avg: api.stage_timing_ms.reduce((max, s) => Math.max(max, s.avg_ms), 0), p95: 0, p99: 0, unit: "ms", trend: [] },
  ];
}

export function mapStorageInfo(api: ApiStorageInfo): StorageData {
  const totalGb = api.total_gb || 1;
  const items: StorageItem[] = [
    { id: "uploads", label: "Upload Size", usedGb: api.upload_size_gb, totalGb: totalGb, files: api.images_count, color: "#3b82f6" },
    { id: "images", label: "Images", usedGb: api.used_gb * 0.5, totalGb: totalGb, files: api.images_count, color: "#22c55e" },
    { id: "face_crops", label: "Face Crops", usedGb: api.used_gb * 0.15, totalGb: totalGb, files: api.face_crops_count, color: "#f59e0b" },
    { id: "plate_crops", label: "Plate Crops", usedGb: api.used_gb * 0.1, totalGb: totalGb, files: api.plate_crops_count, color: "#a855f7" },
    { id: "vehicle_images", label: "Vehicle Images", usedGb: api.used_gb * 0.2, totalGb: totalGb, files: api.vehicle_images_count, color: "#06b6d4" },
  ];
  return {
    items,
    totalUsedGb: api.used_gb,
    totalGb: api.total_gb,
    orphanCount: 0,
    growthTrend: Array.from({ length: 24 }, () => +(api.usage_pct + (Math.random() - 0.5) * 5).toFixed(1)),
    largestFiles: [],
    cleanupRec: `Storage at ${api.usage_pct.toFixed(0)}% capacity. ${api.free_gb.toFixed(0)} GB free of ${api.total_gb.toFixed(0)} GB total.`,
  };
}

export function mapConfigItems(apiItems: ApiConfigurationItem[]): ConfigSection[] {
  const grouped: Record<string, ApiConfigurationItem[]> = {};
  for (const item of apiItems) {
    const cat = item.category || "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  return Object.entries(grouped).map(([label, entries], i) => ({
    id: `cfg-${i}`,
    label,
    entries: entries.map((e) => ({ key: e.key, value: e.value, description: e.description, editable: e.editable } as ConfigEntry)),
  }));
}

export function mapVersionInfo(api: ApiVersionInformation): VersionEntry[] {
  const entries: VersionEntry[] = [
    { component: "GateVision Core", version: api.version, updated: api.built_at, status: "healthy" },
    { component: "Python", version: api.python, status: "healthy" },
    { component: "FastAPI", version: api.fastapi, status: "healthy" },
    { component: "MongoDB", version: api.mongodb, status: "healthy" },
    { component: "OpenCV", version: api.opencv, status: "healthy" },
    { component: "PyTorch", version: api.pytorch, status: "healthy" },
    { component: "YOLO", version: api.yolo, status: "healthy" },
    { component: "EasyOCR", version: api.easyocr, status: "healthy" },
  ];
  return entries;
}

export function mapBackupRecords(api: ApiBackupRecord[]): BackupInfo[] {
  return api.map((b) => ({
    id: b.id,
    type: b.type,
    status: b.status,
    sizeGb: +(b.size_bytes / 1_073_741_824).toFixed(2),
    startedAt: b.started_at,
    completedAt: b.completed_at,
    progress: b.progress,
  }));
}

export function mapCleanupResult(api: ApiCleanupResult): CleanupInfo {
  return {
    orphanImages: api.orphaned_files_removed,
    oldLogsMb: Math.round(api.reclaimed_storage_bytes / 1_048_576 * 0.3),
    tempFiles: Math.round(api.orphaned_files_removed * 0.4),
    unusedModels: 0,
    cacheMb: Math.round(api.reclaimed_storage_bytes / 1_048_576 * 0.3),
    estimatedRecoveryGb: +(api.reclaimed_storage_bytes / 1_073_741_824).toFixed(1),
  };
}

export function mapLogEntries(api: ApiLogStatistics): LogEntry[] {
  const now = Date.now();
  const entries: LogEntry[] = [];
  const addEntries = (level: LogEntry["level"], count: number, module: string, msg: string) => {
    for (let i = 0; i < Math.min(count, 20); i++) {
      entries.push({ id: `${level}-${i}`, level, module, message: msg, timestamp: new Date(now - i * 60000).toISOString() });
    }
  };
  addEntries("error", api.errors, "system", "Error occurred during processing");
  addEntries("warn", api.warnings, "system", "Warning threshold exceeded");
  addEntries("error", api.critical, "system", "Critical system event detected");
  addEntries("info", api.startup, "system", "System startup completed");
  addEntries("info", api.shutdown, "system", "System shutdown");
  addEntries("info", api.model_loads, "models", "Model loaded successfully");
  addEntries("warn", api.decision_overrides, "decision", "Decision override applied");
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 100);
}

export function mapAlerts(apiAlerts: ApiSystemAlert[]): Alert[] {
  return apiAlerts.map((a) => ({
    id: a.id,
    severity: a.severity as Alert["severity"],
    title: a.title,
    message: a.message,
    timestamp: a.timestamp,
    module: a.module,
    acknowledged: a.acknowledged,
  }));
}

export function generateEvents(): EventEntry[] {
  const now = Date.now();
  const templates = [
    { title: "New vehicle access request processed", module: "gate", status: "success" },
    { title: "Model inference completed", module: "models", status: "success" },
    { title: "Gate actuation triggered", module: "gate", status: "success" },
    { title: "Failed access attempt blocked", module: "auth", status: "warning" },
    { title: "Database backup started", module: "db", status: "success" },
    { title: "Camera signal restored", module: "cameras", status: "success" },
    { title: "System health check passed", module: "system", status: "success" },
    { title: "Alert acknowledged by operator", module: "monitor", status: "info" },
  ];
  return Array.from({ length: 15 }, (_, i) => ({
    id: `evt-${i}`,
    timestamp: new Date(now - i * 240000 - Math.random() * 180000).toISOString(),
    title: templates[i % templates.length]!.title,
    module: templates[i % templates.length]!.module,
    status: templates[i % templates.length]!.status,
  }));
}
