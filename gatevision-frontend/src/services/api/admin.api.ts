import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { NormalizedError } from "@/types/api";
import type { ApiDashboardSummary, ApiSystemEvent } from "@/features/administration/api/types";

export async function getAdminDashboardApi(): Promise<ApiDashboardSummary> {
  try {
    const response = await get<ApiDashboardSummary>(ENDPOINTS.DASHBOARD.METRICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch admin dashboard" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getAdminEventsApi(page = 1): Promise<{ items: ApiSystemEvent[]; total: number }> {
  try {
    const response = await get<{ items: ApiSystemEvent[]; total: number }>(ENDPOINTS.ADMIN.EVENTS, { page });
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch events" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
