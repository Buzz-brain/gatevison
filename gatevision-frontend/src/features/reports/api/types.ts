export interface ApiReportRecord {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  status: "draft" | "published" | "archived";
  format: "csv" | "json" | "excel" | "pdf";
  size_kb: number;
  rows: number;
  columns: ApiReportColumn[];
  data: Record<string, string | number>[];
  filters: Record<string, string>;
  created_by: string;
}

export interface ApiReportColumn {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "boolean";
  sortable: boolean;
  filterable: boolean;
}

export interface ApiAnalyticsSummary {
  hourly_traffic: ApiHourlyTraffic[];
  daily_trends: ApiDailyTrendData[];
  decision_breakdown: ApiDecisionBreakdownData[];
  processing_metrics: ApiProcessingMetrics;
  denial_trends: ApiDenialTrend[];
  recognition_statistics: ApiRecognitionStatistics;
  peak_hours: ApiPeakHourData[];
  gate_comparison: ApiGateComparison[];
  vehicle_distribution: ApiVehicleDistribution[];
  manual_review_trend: ApiManualReviewTrend[];
}

export interface ApiHourlyTraffic {
  hour: string;
  entries: number;
  exits: number;
}

export interface ApiDailyTrendData {
  date: string;
  entries: number;
  exits: number;
  total: number;
}

export interface ApiDecisionBreakdownData {
  type: string;
  count: number;
  percentage: number;
}

export interface ApiProcessingMetrics {
  avg_processing_time_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  throughput_per_second: number;
}

export interface ApiDenialTrend {
  date: string;
  count: number;
  reason: string;
}

export interface ApiRecognitionStatistics {
  plate_accuracy: number;
  ocr_accuracy: number;
  face_accuracy: number;
  vehicle_accuracy: number;
  total_processed: number;
  avg_confidence: number;
}

export interface ApiPeakHourData {
  hour: string;
  entries: number;
  exits: number;
}

export interface ApiGateComparison {
  gate_id: string;
  gate_name: string;
  entries: number;
  exits: number;
  avg_wait_sec: number;
  utilization_pct: number;
}

export interface ApiVehicleDistribution {
  type: string;
  count: number;
}

export interface ApiManualReviewTrend {
  date: string;
  count: number;
  resolved: number;
  pending: number;
}

export interface ApiExportRequest {
  format: "csv" | "json" | "excel";
  report_type?: string;
  date_from?: string;
  date_to?: string;
  filters?: Record<string, string>;
}

export interface ApiExportResult {
  id: string;
  format: string;
  status: "processing" | "completed" | "failed";
  url?: string;
  size_kb?: number;
  rows?: number;
  error?: string;
  created_at: string;
}

export interface ApiSearchResult {
  id: string;
  type: "vehicle" | "driver" | "plate" | "request" | "session" | "transaction" | "report";
  label: string;
  description: string;
  score: number;
  metadata: Record<string, string>;
}

export interface ApiManualReviewSummary {
  id: string;
  plate: string;
  driver: string;
  vehicle: string;
  reason: string;
  confidence: number;
  status: "pending" | "resolved" | "escalated";
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface ApiEventSummary {
  id: string;
  type: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  timestamp: string;
  source: string;
  metadata: Record<string, string>;
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
  status: string;
  label: string;
  detail?: string;
  confidence?: number;
  timestamp?: string;
}
