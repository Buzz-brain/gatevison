import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiGateStatistics, ApiGateActive, ApiGateTransaction } from "@/features/dashboard/types/api";
import type { NormalizedError, PaginatedResponse } from "@/types/api";

export async function getGateStatisticsApi(): Promise<ApiGateStatistics> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.GATE.STATISTICS);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      return {
        total_gates: 1,
        gates: [],
        vehicles_inside: (raw.vehicles_inside as number) ?? 0,
        vehicles_outside: (raw.vehicles_outside as number) ?? 0,
        total_sessions: (raw.total_sessions as number) ?? 0,
        total_transactions: (raw.total_transactions as number) ?? 0,
        entries: (raw.entries as number) ?? 0,
        exits: (raw.exits as number) ?? 0,
        today_transactions: (raw.today_transactions as number) ?? 0,
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch gate statistics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getGateActiveApi(): Promise<ApiGateActive> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.GATE.ACTIVE);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      return {
        gates: (raw.gates as ApiGateActive["gates"]) ?? [],
        total_vehicles_inside: 0,
        sessions: (raw.sessions as Array<Record<string, unknown>>) ?? [],
        total: (raw.total as number) ?? 0,
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch active gates" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getGateTransactionsApi(page = 1, pageSize = 50): Promise<PaginatedResponse<ApiGateTransaction>> {
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
