import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiAnalytics } from "@/services/api/types";
import type { ApiAnalyticsSummary } from "@/features/reports/api/types";
import type { NormalizedError } from "@/types/api";

export async function getAnalyticsApi(): Promise<ApiAnalytics> {
  try {
    const response = await get<ApiAnalytics>(ENDPOINTS.DASHBOARD.ANALYTICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch analytics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getReportsAnalyticsApi(): Promise<ApiAnalyticsSummary> {
  try {
    const response = await get<ApiAnalyticsSummary>(ENDPOINTS.DASHBOARD.ANALYTICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch analytics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
