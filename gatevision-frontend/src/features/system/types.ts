import type { LucideIcon } from "lucide-react";

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "down";

export interface ServiceStatus {
  id: string;
  name: string;
  status: HealthStatus;
  label: string;
}

export interface OverallHealth {
  status: HealthStatus;
  score: number;
  services: ServiceStatus[];
}

export interface MetricPoint {
  timestamp: string;
  value: number;
}

export type MetricId = "cpu" | "memory" | "disk" | "gpu" | "network" | "processes" | "threads" | "temperature";

export interface InfrastructureMetric {
  id: MetricId;
  label: string;
  current: number;
  peak: number;
  average: number;
  unit: string;
  trend: MetricPoint[];
}

export type ModelId = "yolo" | "easyocr" | "insightface" | "resnet50" | "decision";

export interface AiModelInfo {
  id: ModelId;
  name: string;
  type: string;
  status: HealthStatus;
  version: string;
  loaded: boolean;
  device: string;
  memoryMb: number;
  inferenceCount: number;
  avgLatencyMs: number;
  failureCount: number;
  uptimeMs: number;
  config: Record<string, string>;
  lastLoaded: string;
}

export interface PipelineStageInfo {
  id: string;
  name: string;
  avgTimeMs: number;
  fastestMs: number;
  slowestMs: number;
  failures: number;
  successPct: number;
  status: HealthStatus;
}

export interface PipelineStatus {
  stages: PipelineStageInfo[];
  currentRequests: number;
  queueSize: number;
  dropped: number;
  totalLatencyMs: number;
  bottleneck: string | null;
}

export interface StatusConfigEntry {
  label: string;
  hex: string;
  icon: LucideIcon;
}

export type CameraStatus = "online" | "offline" | "degraded" | "reconnecting";

export interface CameraInfo {
  id: string;
  name: string;
  status: CameraStatus;
  fps: number;
  resolution: string;
  connection: string;
  lastFrame: string;
  bandwidth: number;
  temperature: number;
  latency: number;
  signal: number;
  location: string;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  level: LogLevel;
  module: string;
  message: string;
  timestamp: string;
  requestId?: string;
}

export type AlertSeverity = "critical" | "warning" | "info" | "resolved";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  module: string;
  acknowledged: boolean;
}

export interface StorageItem {
  id: string;
  label: string;
  usedGb: number;
  totalGb: number;
  files: number;
  color: string;
}

export interface StorageData {
  items: StorageItem[];
  totalUsedGb: number;
  totalGb: number;
  orphanCount: number;
  growthTrend: number[];
  largestFiles: { path: string; sizeGb: number }[];
  cleanupRec: string;
}

export interface PerfMetric {
  id: string;
  label: string;
  avg: number;
  p95: number;
  p99: number;
  unit: string;
  trend: { timestamp: string; value: number }[];
}

export interface BackupInfo {
  id: string;
  type: string;
  status: "success" | "running" | "failed" | "scheduled";
  sizeGb: number;
  startedAt: string;
  completedAt?: string;
  progress: number;
}

export interface CleanupInfo {
  orphanImages: number;
  oldLogsMb: number;
  tempFiles: number;
  unusedModels: number;
  cacheMb: number;
  estimatedRecoveryGb: number;
}

export interface ConfigEntry {
  key: string;
  value: string;
  description: string;
  editable: boolean;
}

export interface ConfigSection {
  id: string;
  label: string;
  entries: ConfigEntry[];
}

export interface VersionEntry {
  component: string;
  version: string;
  updated?: string;
  status?: HealthStatus;
}

export interface EventEntry {
  id: string;
  timestamp: string;
  title: string;
  module: string;
  status: string;
}

export interface SecurityHealth {
  failedLogins: number;
  rateLimitHits: number;
  blockedRequests: number;
  expiredSessions: number;
  manualReviews: number;
  auditEvents: number;
  score: number;
}

export interface TopologyNode {
  id: string;
  label: string;
  type: "user" | "gateway" | "service" | "database" | "model" | "controller";
  status: HealthStatus;
  latency: number;
  throughput: number;
  requests: number;
  children?: TopologyNode[];
}

export interface TopologyEdge {
  source: string;
  target: string;
  latency: number;
  status: HealthStatus;
}

export interface TopologyData {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export interface SystemActivity {
  id: string;
  action: string;
  detail: string;
  timestamp: string;
}
