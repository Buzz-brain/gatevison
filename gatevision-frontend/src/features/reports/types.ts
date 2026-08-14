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
  decisions: string[];
  search: string;
}

export interface DecisionBreakdown {
  type: "granted" | "denied" | "manual_review" | "emergency" | "unknown";
  count: number;
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

export const DECISION_TYPES = [
  "granted",
  "denied",
  "manual_review",
  "emergency",
  "unknown",
] as const;
