import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiGateTransaction, ApiMovementHistory, ApiGateStatistics } from "@/features/gate-operations/api/types";
import type { NormalizedError, PaginatedResponse } from "@/types/api";

export async function getTransactionsApi(page = 1, pageSize = 50): Promise<PaginatedResponse<ApiGateTransaction>> {
  try {
    const response = await get<PaginatedResponse<ApiGateTransaction>>(
      ENDPOINTS.GATE.TRANSACTIONS,
      { page, page_size: pageSize },
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch transactions" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getVehicleHistoryApi(vehicleId: string): Promise<ApiMovementHistory> {
  try {
    const response = await get<ApiMovementHistory>(`/gate/history/${vehicleId}`);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch vehicle history" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getGateStatisticsApi(): Promise<ApiGateStatistics> {
  try {
    const response = await get<ApiGateStatistics>(ENDPOINTS.GATE.STATISTICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch gate statistics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
