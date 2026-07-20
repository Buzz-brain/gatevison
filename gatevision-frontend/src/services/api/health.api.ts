import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { HealthResponse } from "@/types/api";

export async function getHealthApi(): Promise<HealthResponse> {
  try {
    const response = await get<HealthResponse>(ENDPOINTS.HEALTH);
    if (response.success && response.data) {
      return response.data;
    }
    return { status: "degraded", version: "unknown", database: "disconnected", uptime: 0, timestamp: new Date().toISOString() };
  } catch (error) {
    throw normalizeError(error);
  }
}
