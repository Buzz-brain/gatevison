import { get, post } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type {
  ApiIdentityStats, ApiActivityItem, ApiIdentityVerification,
  ApiRelationships,
} from "@/features/identity/types/api";
import type { NormalizedError } from "@/types/api";

export async function getIdentityStatsApi(): Promise<ApiIdentityStats> {
  try {
    const response = await get<ApiIdentityStats>(ENDPOINTS.IDENTITY.STATS);
    if (response.success && response.data) return response.data;
    return { total_drivers: 0, total_vehicles: 0, total_policies: 0, enrollment_rate: 0, verification_success: 0, recognition_quality: 0, drivers_by_status: {} };
  } catch {
    return { total_drivers: 0, total_vehicles: 0, total_policies: 0, enrollment_rate: 0, verification_success: 0, recognition_quality: 0, drivers_by_status: {} };
  }
}

export async function getActivityFeedApi(page = 1, pageSize = 20): Promise<ApiActivityItem[]> {
  try {
    const response = await get<ApiActivityItem[]>(ENDPOINTS.IDENTITY.ACTIVITY, { page, page_size: pageSize });
    if (response.success && response.data) return response.data;
    return [];
  } catch {
    return [];
  }
}

export async function verifyIdentityApi(data: {
  driver_id: string;
  method?: string;
}): Promise<ApiIdentityVerification> {
  try {
    const response = await post<ApiIdentityVerification>(ENDPOINTS.IDENTITY.VERIFY, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Verification failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function searchIdentityApi(
  query: string,
  type?: string,
): Promise<{ drivers: any[]; vehicles: any[]; policies: any[] }> {
  try {
    const response = await get<{ drivers: any[]; vehicles: any[]; policies: any[] }>(
      ENDPOINTS.IDENTITY.SEARCH,
      { q: query, type: type ?? "all" },
    );
    if (response.success && response.data) return response.data;
    return { drivers: [], vehicles: [], policies: [] };
  } catch {
    return { drivers: [], vehicles: [], policies: [] };
  }
}

export async function getRelationshipsApi(): Promise<ApiRelationships> {
  try {
    const response = await get<ApiRelationships>(ENDPOINTS.IDENTITY.RELATIONSHIPS);
    if (response.success && response.data) {
      return response.data;
    }
    return { nodes: [], edges: [] };
  } catch {
    return { nodes: [], edges: [] };
  }
}

export async function linkIdentityApi(fromId: string, toId: string, label: string): Promise<void> {
  try {
    await post(ENDPOINTS.IDENTITY.LINK, { from: fromId, to: toId, label });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function unlinkIdentityApi(fromId: string, toId: string): Promise<void> {
  try {
    await post(ENDPOINTS.IDENTITY.UNLINK, { from: fromId, to: toId });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateStatsApi(data: Partial<ApiIdentityStats>): Promise<ApiIdentityStats> {
  try {
    const response = await post<ApiIdentityStats>("/identity/stats/update", data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to update stats" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
