import { get, post, put, del } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiDriverProfile, ApiDriverEnrollmentRequest } from "@/features/identity/types/api";
import type { NormalizedError, PaginatedResponse } from "@/types/api";

export async function getDriversApi(
  page = 1,
  pageSize = 50,
  search?: string,
): Promise<PaginatedResponse<ApiDriverProfile>> {
  try {
    const params: Record<string, unknown> = { page, page_size: pageSize };
    if (search) params.search = search;
    const response = await get<Record<string, unknown>>(
      ENDPOINTS.IDENTITY.DRIVERS.BASE,
      params,
    );
    if (response.success && response.data) {
      const raw = response.data;
      if (Array.isArray(raw)) return { items: raw as ApiDriverProfile[], total: raw.length, page, pageSize, totalPages: 1 };
      return raw as unknown as PaginatedResponse<ApiDriverProfile>;
    }
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  } catch {
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }
}

export async function getDriverApi(id: string): Promise<ApiDriverProfile> {
  try {
    const response = await get<ApiDriverProfile>(ENDPOINTS.IDENTITY.DRIVERS.BY_ID(id));
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch driver" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createDriverApi(data: ApiDriverEnrollmentRequest): Promise<ApiDriverProfile> {
  try {
    const response = await post<ApiDriverProfile>(ENDPOINTS.IDENTITY.DRIVERS.BASE, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to create driver" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateDriverApi(
  id: string,
  data: Partial<ApiDriverProfile>,
): Promise<ApiDriverProfile> {
  try {
    const response = await put<ApiDriverProfile>(ENDPOINTS.IDENTITY.DRIVERS.BY_ID(id), data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to update driver" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteDriverApi(id: string): Promise<void> {
  try {
    await del(ENDPOINTS.IDENTITY.DRIVERS.BY_ID(id));
  } catch (error) {
    throw normalizeError(error);
  }
}
