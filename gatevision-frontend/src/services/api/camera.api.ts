import { post, get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import { api } from "@/lib/api/axios";
import type { ApiCameraStatus } from "@/features/recognition/types/api";
import type { NormalizedError } from "@/types/api";

export async function startCameraApi(): Promise<ApiCameraStatus> {
  try {
    const response = await post<ApiCameraStatus>(ENDPOINTS.CAMERA.START);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to start camera" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function stopCameraApi(): Promise<void> {
  try {
    await post(ENDPOINTS.CAMERA.STOP);
  } catch {
    // Swallow stop errors
  }
}

export async function getCameraStatusApi(): Promise<ApiCameraStatus> {
  try {
    const response = await get<ApiCameraStatus>(ENDPOINTS.CAMERA.STATUS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to get camera status" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function captureCameraApi(): Promise<string> {
  try {
    const response = await post<{ image_url: string }>(ENDPOINTS.CAMERA.CAPTURE);
    if (response.success && response.data) return response.data.image_url;
    throw { code: "UNKNOWN", message: response.message || "Failed to capture" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function uploadImageApi(file: File, onProgress?: (pct: number) => void): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<string>("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
