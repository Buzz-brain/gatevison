export type PeriodKey = "today" | "yesterday" | "week" | "month" | "custom";

export type GateId = "gate-north" | "gate-south" | "gate-east" | "gate-west" | "gate-vip";

export type SeverityLevel = "low" | "medium" | "high" | "critical";

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  unit?: string;
  display: string;
  changePct: number;
  positive: boolean;
  comparisonLabel: string;
  sparkline: number[];
  insight: string;
  icon: string;
}

export interface FilterState {
  period: PeriodKey;
  customStart: string | null;
  customEnd: string | null;
  gates: GateId[];
  vehicleTypes: string[];
  departments: string[];
  policies: string[];
  decisions: string[];
  recognitionStatus: string[];
  driver: string;
  vehicle: string;
  search: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
}

export interface HourlyTraffic {
  hour: number;
  entries: number;
  exits: number;
}

export interface DailyTrend {
  date: string;
  entries: number;
  exits: number;
}

export interface WeeklyComparison {
  weekday: string;
  thisWeek: number;
  lastWeek: number;
}

export interface MonthlyVolume {
  month: string;
  entries: number;
  exits: number;
}

export interface GateUtilization {
  gateId: GateId;
  gateName: string;
  utilizationPct: number;
  entries: number;
  avgWaitSec: number;
}

export interface HeatmapCell {
  hour: number;
  gateId: GateId;
  density: number;
}

export interface QueuePoint {
  hour: number;
  queue: number;
}

export interface WaitTimePoint {
  hour: number;
  avgWaitSec: number;
}

export interface StayBucket {
  bucket: string;
  count: number;
}

export interface ParkingZone {
  zone: string;
  total: number;
  occupied: number;
}

export interface RecognitionMetric {
  id: string;
  label: string;
  accuracyPct: number;
  changePct: number;
  samples: number;
}

export interface ConfidenceBin {
  bin: string;
  count: number;
}

export interface PipelineStage {
  stage: string;
  count: number;
  avgTimeMs: number;
  successRate: number;
}

export interface AiModel {
  id: string;
  name: string;
  type: string;
  status: "healthy" | "degraded" | "down";
  version: string;
  inferences: number;
  avgLatencyMs: number;
  successRate: number;
  failureRate: number;
  memoryMb: number;
  gpuPct: number;
  latencyTrend: number[];
}

export interface DecisionBreakdown {
  type: "granted" | "denied" | "manual_review" | "emergency" | "unknown";
  count: number;
}

export interface GateDecisionBreakdown {
  gateId: GateId;
  gateName: string;
  granted: number;
  denied: number;
  manualReview: number;
  emergency: number;
  unknown: number;
}

export interface SecurityInsight {
  id: string;
  title: string;
  value: string;
  detail: string;
  severity: SeverityLevel;
  icon: string;
  recommendation: string;
}

export interface RiskFactor {
  label: string;
  contributionPct: number;
  value: string;
  level: SeverityLevel;
}

export interface RiskScore {
  overallPct: number;
  level: SeverityLevel;
  factors: RiskFactor[];
}

export type ReportRow = Record<string, string | number>;

export interface ReportColumn {
  key: string;
  label: string;
  numeric?: boolean;
  pinned?: boolean;
  align?: "left" | "right" | "center";
}

export interface ReportDataset {
  id: string;
  tab: string;
  title: string;
  description: string;
  columns: ReportColumn[];
  rows: ReportRow[];
}

export type ReportBlockKind = "kpi" | "line" | "bar" | "pie" | "table" | "heatmap" | "text";

export interface ReportBlock {
  id: string;
  kind: ReportBlockKind;
  label: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  blocks: ReportBlock[];
  grouping: string;
  filters: string[];
}

export interface SavedReport {
  id: string;
  name: string;
  description: string;
  category: string;
  updatedAt: string;
  format: "csv" | "excel" | "json" | "pdf";
  favorite: boolean;
}

export type ExportFormat = "csv" | "excel" | "json" | "pdf";

export interface ExportJob {
  id: string;
  format: ExportFormat;
  range: string;
  status: "ready" | "scheduled" | "sending";
  sizeKb: number;
  createdAt: string;
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  recommendation: string;
  tone: "positive" | "warning" | "critical";
  icon: string;
  metric: string;
}

export interface ForecastPoint {
  label: string;
  actual: number | null;
  predicted: number;
  lower: number;
  upper: number;
}

export interface ForecastSummary {
  tomorrowEntries: number;
  peakHour: string;
  expectedEntries: number;
  recognitionWorkload: number;
  staffRecommendation: string;
}

export type ActivityType = "export" | "saved" | "deleted" | "scheduled" | "shared" | "favorite";

export interface ActivityEntry {
  id: string;
  time: string;
  type: ActivityType;
  actor: string;
  detail: string;
}

export interface KpiComparison {
  label: string;
  current: string;
  previous: string;
  changePct: number;
  positive: boolean;
}

export interface TimelineEvent {
  time: string;
  event: string;
  severity: SeverityLevel;
}

export interface ExecutiveBriefing {
  narrative: string;
  highlights: string[];
  risks: string[];
  recommendations: string[];
  comparisons: KpiComparison[];
  timeline: TimelineEvent[];
}

export type ReplayPeriod = "morning" | "afternoon" | "evening";

export interface ReplayFrame {
  index: number;
  label: string;
  entries: number;
  denied: number;
  density: number;
}

export const GATE_IDS: GateId[] = [
  "gate-north",
  "gate-south",
  "gate-east",
  "gate-west",
  "gate-vip",
];

export const GATE_NAMES: Record<GateId, string> = {
  "gate-north": "North Gate",
  "gate-south": "South Gate",
  "gate-east": "East Gate",
  "gate-west": "West Gate",
  "gate-vip": "VIP Gate",
};

export const VEHICLE_TYPES = ["Sedan", "SUV", "Truck", "Van", "Motorcycle", "Bus"] as const;

export const DEPARTMENTS = [
  "Engineering",
  "Operations",
  "Security",
  "Logistics",
  "Finance",
  "Administration",
] as const;

export const POLICY_TYPES = [
  "Standard Access",
  "24/7 Access",
  "Business Hours",
  "Restricted",
  "VIP Escort",
] as const;

export const DECISION_TYPES = [
  "granted",
  "denied",
  "manual_review",
  "emergency",
  "unknown",
] as const;

export const RECOGNITION_STATUS = [
  "recognized",
  "manual_review",
  "failed",
  "unknown",
] as const;
