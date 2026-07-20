import { get, put } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { MeResponse } from "@/types/api";

export async function updateProfileApi(data: Partial<MeResponse>): Promise<MeResponse> {
  try {
    const response = await put<MeResponse>(ENDPOINTS.USERS.PROFILE, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error("Failed to update profile");
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getUserApi(id: string): Promise<MeResponse> {
  try {
    const response = await get<MeResponse>(`${ENDPOINTS.USERS.BASE}/${id}`);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error("Failed to fetch user");
  } catch (error) {
    throw normalizeError(error);
  }
}
