export interface ApiDecisionBreakdown {
  total: number;
  grants: number;
  denials: number;
  manual_reviews: number;
  grant_rate: number;
  denial_rate: number;
  review_rate: number;
}

export interface ApiAnalytics {
  hourly_flow?: ApiHourlyFlow[];
  hourly_traffic?: ApiHourlyFlow[];
  daily_trend?: Array<{ date?: string; hour?: string; entries: number; exits: number }>;
  decision_breakdown?: ApiDecisionBreakdown;
  decision_distribution?: ApiDecisionDistribution[];
  accuracy_per_camera?: ApiAccuracyPerCamera[];
  traffic_trend?: ApiTrafficTrend[];
  processing_times?: {
    avg_processing_time_ms: number;
    max_processing_time_ms: number;
    total_decisions: number;
  };
  top_denied_vehicles?: Array<{ vehicle_id: string; plate: string; denial_count: number }>;
}

export interface ApiHourlyFlow {
  hour: string;
  entries: number;
  exits: number;
  total: number;
}

export interface ApiAccuracyPerCamera {
  camera: string;
  accuracy: number;
}

export interface ApiDecisionDistribution {
  name: string;
  value: number;
  color: string;
}

export interface ApiTrafficTrend {
  date: string;
  entries: number;
  exits: number;
}

export interface ApiGateStatistics {
  total_gates?: number;
  gates?: ApiGateInfo[];
  vehicles_inside?: number;
  vehicles_outside?: number;
  total_sessions?: number;
  total_transactions?: number;
  entries?: number;
  exits?: number;
  today_transactions?: number;
}

export interface ApiGateInfo {
  id: string;
  name: string;
  status: string;
  barrier: string;
  sensor_state: string;
  current_vehicle?: string;
  operator: string;
  connection: string;
  last_activity: string;
  entries_today: number;
  exits_today: number;
  vehicles_inside: number;
}

export interface ApiGateActive {
  gates?: ApiGateInfo[];
  total_vehicles_inside?: number;
  sessions?: Array<Record<string, unknown>>;
  total?: number;
}

export interface ApiGateTransaction {
  id: string;
  gate_id: string;
  gate_name: string;
  plate: string;
  type: "entry" | "exit";
  timestamp: string;
  decision: string;
}

export interface ApiSystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  database: string;
  storage: string;
  pipeline: string;
  ai_models: string;
  camera: string;
  uptime: number;
  timestamp: string;
}

export interface ApiModelHealth {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  device: string;
  memory_mb: number;
  inference_count: number;
  avg_latency_ms: number;
  error_count: number;
  last_loaded: string;
}

export interface ApiPerformanceMetrics {
  cpu_usage: number;
  memory_usage: number;
  gpu_usage: number;
  requests_per_second: number;
  avg_latency_ms: number;
  error_rate: number;
}

export interface ApiStorageInfo {
  total_gb: number;
  used_gb: number;
  free_gb: number;
  usage_pct: number;
}

export interface ApiVersionInfo {
  version: string;
  build: string;
  commit: string;
  built_at: string;
}

export interface ApiPipelineStatus {
  status: "running" | "stopped" | "degraded";
  active_jobs: number;
  queue_depth: number;
  avg_processing_ms: number;
  uptime: number;
}

export interface ApiPipelineMetrics {
  total_processed: number;
  avg_processing_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  throughput_per_second: number;
  error_rate: number;
}

export interface ApiCameraStatus {
  camera_id: string | null;
  is_running: boolean;
  source: number;
  frame_count: number;
  status: "running" | "stopped";
  uptime_seconds?: number;
  resolution?: string;
  fps?: number | "unknown";
}

export interface ApiRecognitionHistoryItem {
  id: string;
  plate: string;
  driver: string;
  vehicle: string;
  decision: "granted" | "denied" | "manual_review";
  confidence: number;
  timestamp: string;
  processing_ms: number;
  stages: ApiRecognitionStage[];
}

export interface ApiRecognitionStage {
  stage: string;
  status: string;
  label: string;
  detail?: string;
  confidence?: number;
  timestamp?: string;
}
