import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiLogStatistics } from "@/features/system/api/types";
import type { NormalizedError } from "@/types/api";

export async function getLogStatisticsApi(): Promise<ApiLogStatistics> {
  try {
    const response = await get<ApiLogStatistics>(ENDPOINTS.SYSTEM.LOG_STATISTICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch log statistics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
