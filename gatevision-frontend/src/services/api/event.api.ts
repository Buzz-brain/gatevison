import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiSystemEvent, ApiDecisionStatistics, ApiDecisionHistoryItem } from "@/features/dashboard/types/api";
import type { NormalizedError, PaginatedResponse } from "@/types/api";

export async function getSystemEventsApi(page = 1, pageSize = 50): Promise<ApiSystemEvent[]> {
  try {
    const response = await get<ApiSystemEvent[]>(ENDPOINTS.DASHBOARD.EVENTS, { page, page_size: pageSize });
    if (response.success && response.data) return response.data;
    return [];
  } catch {
    return [];
  }
}

export async function getDecisionStatisticsApi(): Promise<ApiDecisionStatistics> {
  try {
    const response = await get<ApiDecisionStatistics>(ENDPOINTS.DECISION.STATISTICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch decision statistics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getDecisionHistoryApi(page = 1, pageSize = 20): Promise<PaginatedResponse<ApiDecisionHistoryItem>> {
  try {
    const response = await get<PaginatedResponse<ApiDecisionHistoryItem>>(
      ENDPOINTS.DECISION.HISTORY,
      { page, page_size: pageSize },
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch decision history" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getRecognitionHistoryApi(page = 1, pageSize = 20): Promise<PaginatedResponse<any>> {
  try {
    const response = await get<PaginatedResponse<any>>(
      ENDPOINTS.PLATE_DETECTION.HISTORY,
      { page, page_size: pageSize },
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch recognition history" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
