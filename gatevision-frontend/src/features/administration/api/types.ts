export interface ApiDashboardSummary {
  metrics: ApiAdminMetrics;
  activity: ApiAdminActivity[];
  recent_decisions: ApiRecentDecision[];
  daily_trend: ApiDailyTrend[];
  peak_hours: ApiPeakHour[];
}

export interface ApiAdminMetrics {
  vehicles_processed: number;
  entries: number;
  exits: number;
  denied: number;
  manual_reviews: number;
  avg_processing_time: number;
  recognition_accuracy: number;
  peak_hour: string;
  vehicles_inside: number;
  busy_gate: string;
  entries_today: number;
  exits_today: number;
}

export interface ApiAdminActivity {
  id: string;
  type: string;
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
  decision: string;
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

export interface ApiManualReview {
  id: string;
  plate: string;
  driver_name: string;
  vehicle: string;
  reason: string;
  confidence: number;
  timestamp: string;
  status: "pending" | "approved" | "rejected" | "escalated";
  reviewer?: string;
  notes?: string;
  ocr_confidence: number;
  face_confidence: number;
  vehicle_confidence: number;
}

export interface ApiReviewDecision {
  status: "approved" | "rejected" | "escalated";
  reviewer: string;
  notes?: string;
}

export interface ApiSystemEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info" | "resolved";
  timestamp: string;
  user?: string;
  module: string;
  acknowledged: boolean;
  assignee?: string;
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
