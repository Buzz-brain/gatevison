import { post } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import { api } from "@/lib/api/axios";
import type {
  ApiEnrollmentResult,
  ApiDriverEnrollmentRequest,
  ApiVehicleEnrollmentRequest,
} from "@/features/identity/types/api";
import type { NormalizedError } from "@/types/api";

export async function enrollDriverApi(
  data: ApiDriverEnrollmentRequest,
): Promise<ApiEnrollmentResult> {
  try {
    const response = await post<ApiEnrollmentResult>(ENDPOINTS.IDENTITY.ENROLLMENT.DRIVER, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Driver enrollment failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function enrollVehicleApi(
  data: ApiVehicleEnrollmentRequest,
): Promise<ApiEnrollmentResult> {
  try {
    const response = await post<ApiEnrollmentResult>(ENDPOINTS.IDENTITY.ENROLLMENT.VEHICLE, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Vehicle enrollment failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function enrollDriverWithImageApi(
  data: ApiDriverEnrollmentRequest,
  faceImage?: File,
  onProgress?: (pct: number) => void,
): Promise<ApiEnrollmentResult> {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (faceImage) formData.append("face_image", faceImage);
    const response = await api.post<{ success: boolean; data: ApiEnrollmentResult; message: string }>(
      ENDPOINTS.IDENTITY.ENROLLMENT.DRIVER,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    if (response.data.success && response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "Driver enrollment failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function enrollVehicleWithImageApi(
  data: ApiVehicleEnrollmentRequest,
  vehicleImage?: File,
  onProgress?: (pct: number) => void,
): Promise<ApiEnrollmentResult> {
  try {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (vehicleImage) formData.append("vehicle_image", vehicleImage);
    const response = await api.post<{ success: boolean; data: ApiEnrollmentResult; message: string }>(
      ENDPOINTS.IDENTITY.ENROLLMENT.VEHICLE,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    if (response.data.success && response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "Vehicle enrollment failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
