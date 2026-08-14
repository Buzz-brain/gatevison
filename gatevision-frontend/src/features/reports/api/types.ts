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

// Backend GET /admin/reports
export interface ApiReportTransaction {
  transaction_id: string;
  session_id: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  action: string;
  decision: string;
  timestamp: string;
  request_id: string | null;
  gate_name: string | null;
  notes: string | null;
}

export interface ApiReportData {
  report_type: string;
  total: number;
  results: ApiReportTransaction[];
  start_date: string;
  end_date: string;
}

// Backend GET /admin/analytics
export interface ApiAnalyticsSummary {
  hourly_traffic: ApiHourlyTraffic[];
  daily_trend: ApiDailyTrendData[];
  decision_breakdown: ApiDecisionBreakdownSummary;
  processing_times: ApiProcessingTimes;
  top_denied_vehicles: ApiTopDeniedVehicle[];
}

export interface ApiHourlyTraffic {
  hour: number;
  count: number;
}

export interface ApiDailyTrendData {
  _id: string;
  count: number;
  entries: number;
  exits: number;
}

export interface ApiDecisionBreakdownSummary {
  total: number;
  grants: number;
  denials: number;
  manual_reviews: number;
  grant_rate: number;
  denial_rate: number;
  review_rate: number;
}

export interface ApiProcessingTimes {
  avg_processing_time_ms: number;
  max_processing_time_ms: number;
  total_decisions: number;
}

export interface ApiTopDeniedVehicle {
  vehicle_id: string;
  count: number;
}

// Backend GET /admin/manual-reviews
export interface ApiManualReview {
  review_id: string;
  request_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  status: string;
  outcome: string | null;
  reviewer_id: string | null;
  reviewer_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
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
