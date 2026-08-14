import { del, get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiGateActive } from "@/features/gate-operations/api/types";
import type { NormalizedError } from "@/types/api";

export async function getActiveSessionsApi(): Promise<ApiGateActive> {
  try {
    const response = await get<ApiGateActive>(ENDPOINTS.GATE.ACTIVE);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch active sessions" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function forceCloseSessionApi(vehicleId: string): Promise<void> {
  try {
    const response = await del<{ session_id: string; vehicle_id: string; current_state: string }>(
      ENDPOINTS.GATE.SESSION(vehicleId),
    );
    if (response.success) return;
    throw { code: "UNKNOWN", message: response.message || "Failed to close session" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
