import { get, post, put, del } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiAccessPolicy, ApiPolicyPermission, ApiWeeklySchedule } from "@/features/identity/types/api";
import type { NormalizedError, PaginatedResponse } from "@/types/api";

export async function getPoliciesApi(
  page = 1,
  pageSize = 50,
  search?: string,
): Promise<PaginatedResponse<ApiAccessPolicy>> {
  try {
    const params: Record<string, unknown> = { page, page_size: pageSize };
    if (search) params.search = search;
    const response = await get<Record<string, unknown>>(
      ENDPOINTS.IDENTITY.POLICIES.BASE,
      params,
    );
    if (response.success && response.data) {
      const raw = response.data;
      if (Array.isArray(raw)) return { items: raw as ApiAccessPolicy[], total: raw.length, page, page_size: pageSize, total_pages: 1 };
      return raw as PaginatedResponse<ApiAccessPolicy>;
    }
    return { items: [], total: 0, page, page_size: pageSize, total_pages: 1 };
  } catch {
    return { items: [], total: 0, page, page_size: pageSize, total_pages: 1 };
  }
}

export async function getPolicyApi(id: string): Promise<ApiAccessPolicy> {
  try {
    const response = await get<ApiAccessPolicy>(ENDPOINTS.IDENTITY.POLICIES.BY_ID(id));
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch policy" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createPolicyApi(data: {
  name: string;
  type: string;
  allowed_gates: string[];
  schedule: ApiWeeklySchedule;
  priority: number;
  permissions: ApiPolicyPermission[];
  driver_ids: string[];
  vehicle_ids: string[];
}): Promise<ApiAccessPolicy> {
  try {
    const response = await post<ApiAccessPolicy>(ENDPOINTS.IDENTITY.POLICIES.BASE, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to create policy" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updatePolicyApi(
  id: string,
  data: Partial<ApiAccessPolicy>,
): Promise<ApiAccessPolicy> {
  try {
    const response = await put<ApiAccessPolicy>(ENDPOINTS.IDENTITY.POLICIES.BY_ID(id), data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to update policy" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deletePolicyApi(id: string): Promise<void> {
  try {
    await del(ENDPOINTS.IDENTITY.POLICIES.BY_ID(id));
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function duplicatePolicyApi(id: string): Promise<ApiAccessPolicy> {
  try {
    const response = await post<ApiAccessPolicy>(`${ENDPOINTS.IDENTITY.POLICIES.BY_ID(id)}/duplicate`);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to duplicate policy" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
