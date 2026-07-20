import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiGateActive, ApiGateSession, ApiSessionState, ApiActiveVehicle } from "@/features/gate-operations/api/types";
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

export async function getSessionByVehicleApi(vehicleId: string): Promise<ApiSessionState> {
  try {
    const response = await get<ApiSessionState>(`/gate/session/${vehicleId}`);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch session" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
