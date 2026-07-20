import { post, get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import { api } from "@/lib/api/axios";
import type { ApiFaceData, ApiRecognitionHistoryEntry } from "@/features/recognition/types/api";
import type { NormalizedError, PaginatedResponse } from "@/types/api";

export async function recognizeFaceUploadApi(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ApiFaceData> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ success: boolean; data: ApiFaceData; message: string }>(
      ENDPOINTS.FACE.RECOGNIZE_UPLOAD,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    if (response.data.success && response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "Face recognition failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function recognizeFaceCameraApi(): Promise<ApiFaceData> {
  try {
    const response = await post<ApiFaceData>(ENDPOINTS.FACE.RECOGNIZE_CAMERA);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Face recognition from camera failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getFaceHistoryApi(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<ApiRecognitionHistoryEntry>> {
  try {
    const response = await get<PaginatedResponse<ApiRecognitionHistoryEntry>>(
      ENDPOINTS.FACE.HISTORY,
      { page, page_size: pageSize },
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch face history" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
