import { get, post, put, del } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiVehicleProfile, ApiVehicleEnrollmentRequest } from "@/features/identity/types/api";
import type { NormalizedError, PaginatedResponse } from "@/types/api";

export async function getVehiclesApi(
  page = 1,
  pageSize = 50,
  search?: string,
): Promise<PaginatedResponse<ApiVehicleProfile>> {
  try {
    const params: Record<string, unknown> = { page, page_size: pageSize };
    if (search) params.search = search;
    const response = await get<Record<string, unknown>>(
      ENDPOINTS.IDENTITY.VEHICLES.BASE,
      params,
    );
    if (response.success && response.data) {
      const raw = response.data;
      if (Array.isArray(raw)) return { items: raw as ApiVehicleProfile[], total: raw.length, page, pageSize, totalPages: 1 };
      return raw as unknown as PaginatedResponse<ApiVehicleProfile>;
    }
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  } catch {
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }
}

export async function getVehicleApi(id: string): Promise<ApiVehicleProfile> {
  try {
    const response = await get<ApiVehicleProfile>(ENDPOINTS.IDENTITY.VEHICLES.BY_ID(id));
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch vehicle" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createVehicleApi(data: ApiVehicleEnrollmentRequest): Promise<ApiVehicleProfile> {
  try {
    const response = await post<ApiVehicleProfile>(ENDPOINTS.IDENTITY.VEHICLES.BASE, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to create vehicle" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateVehicleApi(
  id: string,
  data: Partial<ApiVehicleProfile>,
): Promise<ApiVehicleProfile> {
  try {
    const response = await put<ApiVehicleProfile>(ENDPOINTS.IDENTITY.VEHICLES.BY_ID(id), data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to update vehicle" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteVehicleApi(id: string): Promise<void> {
  try {
    await del(ENDPOINTS.IDENTITY.VEHICLES.BY_ID(id));
  } catch (error) {
    throw normalizeError(error);
  }
}
