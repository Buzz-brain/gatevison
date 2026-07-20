import { post, get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import { api } from "@/lib/api/axios";
import type { ApiVehicleFingerprint } from "@/features/recognition/types/api";
import type { NormalizedError } from "@/types/api";

export async function fingerprintVehicleUploadApi(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ApiVehicleFingerprint> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ success: boolean; data: ApiVehicleFingerprint; message: string }>(
      ENDPOINTS.VEHICLE.FINGERPRINT_UPLOAD,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    if (response.data.success && response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "Vehicle fingerprint failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function fingerprintVehicleCameraApi(): Promise<ApiVehicleFingerprint> {
  try {
    const response = await post<ApiVehicleFingerprint>(ENDPOINTS.VEHICLE.FINGERPRINT_CAMERA);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Camera fingerprint failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function storeVehicleApi(data: {
  plate: string;
  model: string;
  features: string[];
  embedding: number[];
}): Promise<{ vehicle_id: string }> {
  try {
    const response = await post<{ vehicle_id: string }>(ENDPOINTS.VEHICLE.STORE, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to store vehicle" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function lookupVehicleApi(plate: string): Promise<ApiVehicleFingerprint> {
  try {
    const response = await post<ApiVehicleFingerprint>(ENDPOINTS.VEHICLE.LOOKUP, { plate });
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Vehicle lookup failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function verifyVehicleApi(
  file: File,
  plate?: string,
): Promise<{ matched: boolean; confidence: number; details: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (plate) formData.append("plate", plate);
    const response = await api.post<{ success: boolean; data: { matched: boolean; confidence: number; details: string }; message: string }>(
      ENDPOINTS.VEHICLE.VERIFY,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    if (response.data.success && response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "Vehicle verification failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
