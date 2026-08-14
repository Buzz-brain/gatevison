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

