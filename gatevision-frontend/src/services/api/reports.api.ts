import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { NormalizedError } from "@/types/api";
import type {
  ApiReportRecord, ApiReportColumn, ApiReportData, ApiReportTransaction,
  ApiManualReviewSummary, ApiManualReview,
} from "@/features/reports/api/types";

const REPORT_PAGE_SIZE = 100;

const REPORT_COLUMNS: ApiReportColumn[] = [
  { key: "time", label: "Time", type: "date", sortable: true, filterable: false },
  { key: "vehicle", label: "Vehicle", type: "string", sortable: true, filterable: true },
  { key: "driver", label: "Driver", type: "string", sortable: true, filterable: true },
  { key: "action", label: "Action", type: "string", sortable: true, filterable: true },
  { key: "decision", label: "Decision", type: "string", sortable: true, filterable: true },
  { key: "gate", label: "Gate", type: "string", sortable: true, filterable: true },
  { key: "request_id", label: "Request ID", type: "string", sortable: false, filterable: false },
];

function txnToRow(t: ApiReportTransaction): Record<string, string | number> {
  return {
    time: t.timestamp ?? "",
    vehicle: t.vehicle_id ?? "-",
    driver: t.driver_id ?? "-",
    action: t.action ?? "",
    decision: t.decision ?? "",
    gate: t.gate_name ?? "-",
    request_id: t.request_id ?? "-",
  };
}

export interface ReportsQuery {
  page?: number;
  type?: string;
  date_from?: string;
  date_to?: string;
  driver?: string;
  vehicle?: string;
  plate?: string;
  decision?: string;
  manual_review?: string;
  gate?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: string;
}

export async function getReportsApi(params?: ReportsQuery): Promise<{ items: ApiReportRecord[]; total: number; page: number; pageSize: number; totalPages: number }> {
  try {
    const page = params?.page ?? 1;
    const query: Record<string, unknown> = {
      report_type: params?.type ?? "daily",
      skip: (page - 1) * REPORT_PAGE_SIZE,
      limit: REPORT_PAGE_SIZE,
    };
    if (params?.date_from) query.start_date = params.date_from;
    if (params?.date_to) query.end_date = params.date_to;
    if (params?.vehicle || params?.plate) query.vehicle_id = params.vehicle ?? params.plate;
    if (params?.driver) query.driver_id = params.driver;
    if (params?.decision) query.decision = params.decision;

    const response = await get<ApiReportData>(ENDPOINTS.DASHBOARD.REPORTS, query);
    if (response.success && response.data) {
      const data = response.data;
      const item: ApiReportRecord = {
        id: `report-${data.report_type}`,
        type: data.report_type,
        title: `${data.report_type} access report`,
        description: `${data.total} records from ${data.start_date} to ${data.end_date}`,
        created_at: data.end_date,
        updated_at: data.end_date,
        status: "published",
        format: "json",
        size_kb: 0,
        rows: data.results.length,
        columns: REPORT_COLUMNS,
        data: (data.results ?? []).map(txnToRow),
        filters: {},
        created_by: "system",
      };
      return {
        items: [item],
        total: data.total,
        page,
        pageSize: REPORT_PAGE_SIZE,
        totalPages: Math.max(1, Math.ceil(data.total / REPORT_PAGE_SIZE)),
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch reports" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getManualReviewsApi(params?: {
  status?: string;
}): Promise<{ items: ApiManualReviewSummary[] }> {
  try {
    const query: Record<string, unknown> = { limit: 100 };
    if (params?.status) query.status = params.status;
    const response = await get<{ results: ApiManualReview[]; total: number; pending_count: number }>(
      ENDPOINTS.ADMIN.MANUAL_REVIEWS,
      query,
    );
    if (response.success && response.data) {
      return { items: (response.data.results ?? []).map(mapReviewItem) };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch manual reviews" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

function mapReviewItem(r: ApiManualReview): ApiManualReviewSummary {
  return {
    id: r.review_id,
    plate: r.vehicle_id ?? r.request_id ?? "-",
    driver: r.driver_id ?? "-",
    vehicle: r.vehicle_id ?? "-",
    reason: r.reviewer_notes ?? r.outcome ?? "Pending manual review",
    confidence: 0,
    status: mapReviewStatus(r.status),
    created_at: r.created_at,
    resolved_at: r.reviewed_at,
    resolved_by: r.reviewer_id,
  };
}

function mapReviewStatus(status?: string | null): "pending" | "resolved" | "escalated" {
  if (!status || status === "pending") return "pending";
  if (status === "escalated") return "escalated";
  return "resolved";
}
