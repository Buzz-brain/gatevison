import { api } from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";

export interface PendingVehicleInfo {
  id: string;
  source: string;
  plate_text: string;
  direction: "entry" | "exit";
  vehicles_detected: number;
  processing_time_ms: number;
  created_at: string | null;
  expires_at: string | null;
}

export async function getPendingVehicleApi(
  direction: "entry" | "exit" = "entry",
): Promise<PendingVehicleInfo | null> {
  try {
    const response = await api.get<{ success: boolean; data: PendingVehicleInfo | null; message: string }>(
      ENDPOINTS.PIPELINE.PENDING_GET,
      { params: { direction } },
    );
    const body = response.data;
    if (body.success && body.data) return body.data;
    return null;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createPendingVehicleApi(
  direction: "entry" | "exit" = "entry",
): Promise<PendingVehicleInfo> {
  try {
    const response = await api.post<{ success: boolean; data: { pending_vehicle: PendingVehicleInfo } | { message?: string }; message: string }>(
      ENDPOINTS.PIPELINE.PENDING_CREATE,
      undefined,
      { params: { direction } },
    );
    const body = response.data;
    const pending = body.data as { pending_vehicle?: PendingVehicleInfo };
    if (body.success && pending?.pending_vehicle) return pending.pending_vehicle;
    throw { code: "UNKNOWN", message: body.message || "Could not create a pending vehicle" };
  } catch (error) {
    throw normalizeError(error);
  }
}