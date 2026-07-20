export interface ApiSystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  database: string;
  cameras: string;
  pipeline: string;
  storage: string;
  ai_services: string;
  uptime_seconds: number;
  timestamp: string;
}

export interface ApiModelHealth {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "unhealthy" | "loading" | "unloaded";
  version: string;
  device: string;
  memory_mb: number;
  inference_count: number;
  avg_latency_ms: number;
  error_count: number;
  last_loaded: string;
}

export interface ApiDatabaseHealth {
  status: "healthy" | "degraded" | "unhealthy";
  connections_active: number;
  connections_idle: number;
  queries_per_second: number;
  avg_query_time_ms: number;
  replication_lag_ms: number;
  size_mb: number;
  error_count: number;
  timestamp: string;
}

export interface ApiStorageInfo {
  total_gb: number;
  used_gb: number;
  free_gb: number;
  usage_pct: number;
  upload_size_gb: number;
  images_count: number;
  face_crops_count: number;
  plate_crops_count: number;
  vehicle_images_count: number;
}

export interface ApiPerformanceMetrics {
  pipeline_duration_avg_ms: number;
  stage_timing_ms: { stage: string; avg_ms: number; p95_ms: number; p99_ms: number }[];
  success_rate: number;
  failure_rate: number;
  avg_processing_ms: number;
  slowest_stage: string;
  cpu_usage: number;
  memory_usage: number;
  gpu_usage: number;
  requests_per_second: number;
  error_rate: number;
}

export interface ApiConfigurationItem {
  key: string;
  value: string;
  description: string;
  editable: boolean;
  category: string;
}

export interface ApiVersionInformation {
  version: string;
  python: string;
  fastapi: string;
  mongodb: string;
  opencv: string;
  pytorch: string;
  yolo: string;
  easyocr: string;
  build: string;
  commit: string;
  built_at: string;
}

export interface ApiBackupRecord {
  id: string;
  type: string;
  status: "success" | "running" | "failed" | "scheduled";
  size_bytes: number;
  started_at: string;
  completed_at?: string;
  progress: number;
}

export interface ApiLogStatistics {
  errors: number;
  warnings: number;
  critical: number;
  startup: number;
  shutdown: number;
  model_loads: number;
  decision_overrides: number;
}

export interface ApiCleanupResult {
  orphaned_files_removed: number;
  reclaimed_storage_bytes: number;
  duration_ms: number;
  success: boolean;
}

export interface ApiMonitoringStatus {
  alerts: ApiSystemAlert[];
  uptime_seconds: number;
  last_check: string;
}

export interface ApiSystemAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  module: string;
  acknowledged: boolean;
}
