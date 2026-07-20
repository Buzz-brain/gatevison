import { post, get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import { api } from "@/lib/api/axios";
import type {
  ApiPipelineResult, ApiPipelineStatus, ApiPipelineMetrics,
} from "@/features/recognition/types/api";
import type { NormalizedError } from "@/types/api";

export async function processPipelineUploadApi(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<ApiPipelineResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ success: boolean; data: ApiPipelineResult; message: string }>(
      ENDPOINTS.PIPELINE.PROCESS_UPLOAD,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    if (response.data.success && response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "Pipeline processing failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function processPipelineCameraApi(): Promise<ApiPipelineResult> {
  try {
    const { api } = await import("@/lib/api/axios");
    const response = await api.post<{ success: boolean; data: ApiPipelineResult; message: string }>(
      ENDPOINTS.PIPELINE.PROCESS_CAMERA,
      undefined,
      { timeout: 120_000 },
    );
    if (response.data.success && response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "Camera pipeline processing failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getPipelineStatusApi(pipelineId: string): Promise<ApiPipelineStatus> {
  try {
    const response = await get<ApiPipelineStatus>(ENDPOINTS.PIPELINE.STATUS, { pipeline_id: pipelineId });
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to get pipeline status" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getPipelineMetricsApi(): Promise<ApiPipelineMetrics> {
  try {
    const response = await get<ApiPipelineMetrics>(ENDPOINTS.PIPELINE.METRICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to get pipeline metrics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
