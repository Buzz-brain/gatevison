import { get, post } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { NormalizedError } from "@/types/api";
import type {
  ApiReportRecord, ApiAnalyticsSummary, ApiSearchResult,
  ApiManualReviewSummary, ApiEventSummary, ApiDecisionHistoryItem,
} from "@/features/reports/api/types";

export async function getReportsApi(params?: {
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
}): Promise<{ items: ApiReportRecord[]; total: number; page: number; pageSize: number; totalPages: number }> {
  try {
    const response = await get<{ items: ApiReportRecord[]; total: number; page: number; pageSize: number; totalPages: number }>(
      ENDPOINTS.DASHBOARD.REPORTS,
      { params },
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch reports" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getAnalyticsApi(): Promise<ApiAnalyticsSummary> {
  try {
    const response = await get<ApiAnalyticsSummary>(ENDPOINTS.DASHBOARD.ANALYTICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch analytics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function searchReportsApi(params: {
  q: string;
  type?: string;
}): Promise<{ items: ApiSearchResult[] }> {
  try {
    const response = await get<{ items: ApiSearchResult[] }>(ENDPOINTS.ADMIN.SEARCH, { params });
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Search failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getManualReviewsApi(params?: {
  status?: string;
}): Promise<{ items: ApiManualReviewSummary[] }> {
  try {
    const response = await get<{ items: ApiManualReviewSummary[] }>(ENDPOINTS.ADMIN.MANUAL_REVIEWS, { params });
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch manual reviews" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getEventsApi(params?: {
  page?: number;
  severity?: string;
}): Promise<{ items: ApiEventSummary[]; total: number }> {
  try {
    const response = await get<{ items: ApiEventSummary[]; total: number }>(ENDPOINTS.ADMIN.EVENTS, { params });
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch events" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
