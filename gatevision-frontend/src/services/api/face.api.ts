import { post, get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import { api } from "@/lib/api/axios";
import type { NormalizedError } from "@/types/api";

export interface EnrollFaceParams {
  driverId: string;
  fullName: string;
  file: File;
  email?: string;
  phone?: string;
  department?: string;
}

export interface EnrollFaceResult {
  driver_id: string;
  full_name: string;
  face_embedding_dimension: number;
}

export interface RecognizeFaceResult {
  face_detected: boolean;
  face_count: number;
  similarity_score: number | null;
  matched: boolean;
  embedding_dimension: number;
  inference_time_ms: number;
  detections: Array<{
    bbox: number[];
    confidence: number;
    similarity_score: number | null;
    matched: boolean;
    embedding_dimension: number;
  }>;
}

export async function enrollFaceApi(
  params: EnrollFaceParams,
): Promise<EnrollFaceResult> {
  try {
    const formData = new FormData();
    formData.append("file", params.file);
    formData.append("driver_id", params.driverId);
    formData.append("full_name", params.fullName);
    if (params.email) formData.append("email", params.email);
    if (params.phone) formData.append("phone", params.phone);
    if (params.department) formData.append("department", params.department);

    const response = await api.post<{ success: boolean; data: EnrollFaceResult; message: string }>(
      ENDPOINTS.FACE.ENROLL,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      },
    );
    if (response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "Face enrollment failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function recognizeFaceUploadApi(
  file: File,
): Promise<RecognizeFaceResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{ success: boolean; data: RecognizeFaceResult; message: string }>(
      ENDPOINTS.FACE.RECOGNIZE_UPLOAD,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      },
    );
    if (response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "Face recognition failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export interface FaceCompareResult {
  similarity_score: number;
  is_match: boolean;
  threshold: number;
  distance_metric: string;
}

export async function compareFacesApi(
  embeddingA: number[],
  embeddingB: number[],
  metric = "cosine",
): Promise<FaceCompareResult> {
  try {
    const response = await post<FaceCompareResult>(
      `${ENDPOINTS.FACE.COMPARE}?metric=${encodeURIComponent(metric)}`,
      { embedding_a: embeddingA, embedding_b: embeddingB },
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Face comparison failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export interface FaceModelInfo {
  loaded: boolean;
  model_name: string;
  device: string;
  version: string;
}

export async function getFaceModelInfoApi(): Promise<FaceModelInfo> {
  try {
    const response = await get<FaceModelInfo>(ENDPOINTS.FACE.MODEL_INFO);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch face model info" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
