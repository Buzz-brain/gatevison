import { post } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiDecisionData } from "@/features/recognition/types/api";
import type { NormalizedError } from "@/types/api";

export async function evaluateDecisionApi(data: {
  pipeline_id?: string;
  ocr_confidence?: number;
  face_similarity?: number;
  vehicle_similarity?: number;
  identity_verified?: boolean;
}): Promise<ApiDecisionData> {
  try {
    const response = await post<ApiDecisionData>(ENDPOINTS.DECISION.EVALUATE, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Decision evaluation failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
