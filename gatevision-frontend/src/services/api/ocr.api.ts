import { post, get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import { api } from "@/lib/api/axios";
import type { ApiOCRData, ApiRecognitionHistoryEntry } from "@/features/recognition/types/api";
import type { NormalizedError, PaginatedResponse } from "@/types/api";

export async function readOcrApi(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ApiOCRData> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ success: boolean; data: ApiOCRData; message: string }>(
      ENDPOINTS.OCR.READ,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    if (response.data.success && response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "OCR failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getOcrHistoryApi(
  page = 1,
  pageSize = 20,
): Promise<PaginatedResponse<ApiRecognitionHistoryEntry>> {
  try {
    const response = await get<PaginatedResponse<ApiRecognitionHistoryEntry>>(
      ENDPOINTS.OCR.HISTORY,
      { page, page_size: pageSize },
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch OCR history" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
