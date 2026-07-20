export interface ApiDashboardMetrics {
  metrics: {
    total_vehicles: number;
    total_drivers: number;
    vehicles_inside: number;
    entries_today: number;
    exits_today: number;
    grant_count: number;
    denial_count: number;
    manual_review_count: number;
    total_decisions: number;
    grant_rate: number;
    denial_rate: number;
    manual_review_rate: number;
    avg_processing_time_ms: number;
    pending_reviews: number;
  };
  most_active_vehicles: Array<{ vehicle_id: string; plate: string; entry_count: number }>;
  peak_entry_hours: Array<{ hour: string; count: number }>;
  daily_trend: Array<{ date: string; entries: number; exits: number; total: number }>;
}

export interface ApiDashboardSummary {
  metrics: ApiDashboardMetrics;
  activity: ApiDashboardActivity[];
  recent_decisions: ApiRecentDecision[];
  daily_trend: ApiDailyTrend[];
  peak_hours: ApiPeakHour[];
}

export interface ApiDashboardActivity {
  id: string;
  type: "entry" | "exit" | "denied" | "alert" | "system" | "review" | "warning" | "manual_review";
  message: string;
  timestamp: string;
  plate?: string;
  confidence?: number;
}

export interface ApiRecentDecision {
  id: string;
  plate: string;
  driver: string;
  vehicle: string;
  decision: "granted" | "denied" | "manual_review";
  confidence: number;
  timestamp: string;
  processing_time: number;
}

export interface ApiDailyTrend {
  date: string;
  entries: number;
  exits: number;
  total: number;
}

export interface ApiPeakHour {
  hour: string;
  count: number;
}

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
  id: string;
  name: string;
  gate: string;
  status: "online" | "offline" | "degraded";
  fps: number;
  is_recording: boolean;
  last_motion: string;
}

export interface ApiDecisionStatistics {
  total: number;
  granted: number;
  denied: number;
  manual_review: number;
  avg_confidence: number;
  avg_processing_ms: number;
}

export interface ApiDecisionHistoryItem {
  id: string;
  plate: string;
  driver: string;
  vehicle: string;
  decision: "granted" | "denied" | "manual_review";
  confidence: number;
  timestamp: string;
  processing_ms: number;
  stages: ApiDecisionStage[];
}

export interface ApiDecisionStage {
  stage: string;
  status: "pending" | "active" | "completed" | "failed";
  label: string;
  detail?: string;
  confidence?: number;
  timestamp?: string;
}

export interface ApiSystemEvent {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  plate?: string;
  confidence?: number;
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
