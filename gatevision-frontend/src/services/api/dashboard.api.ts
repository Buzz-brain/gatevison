import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiDashboardMetrics, ApiDashboardSummary, ApiDashboardActivity } from "@/features/dashboard/types/api";
import type { NormalizedError } from "@/types/api";

export async function getDashboardMetricsApi(): Promise<ApiDashboardMetrics> {
  try {
    const response = await get<ApiDashboardMetrics>(ENDPOINTS.DASHBOARD.METRICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch metrics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getDashboardSummaryApi(): Promise<ApiDashboardSummary> {
  try {
    const response = await get<ApiDashboardSummary>(ENDPOINTS.DASHBOARD.METRICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch summary" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getDashboardEventsApi(page = 1, pageSize = 50): Promise<ApiDashboardActivity[]> {
  try {
    const response = await get<{ results: Array<Record<string, unknown>> }>(ENDPOINTS.DASHBOARD.EVENTS, { page, page_size: pageSize });
    if (response.success && response.data) {
      const results = response.data.results ?? [];
      return results.map((e: Record<string, unknown>) => ({
        id: (e.event_id as string) || (e.id as string) || "",
        type: ((e.severity as string) === "error" || (e.severity as string) === "critical" ? "alert"
          : (e.severity as string) === "warning" ? "warning"
          : (e.event_type as string) === "entry" ? "entry"
          : (e.event_type as string) === "exit" ? "exit"
          : (e.event_type as string) === "denied" ? "denied"
          : "system") as ApiDashboardActivity["type"],
        message: (e.description as string) || (e.message as string) || "",
        timestamp: (e.created_at as string) || (e.timestamp as string) || new Date().toISOString(),
        plate: e.plate as string | undefined,
        confidence: e.confidence as number | undefined,
      }));
    }
    return [];
  } catch {
    return [];
  }
}
