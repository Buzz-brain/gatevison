import { get, post } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { NormalizedError } from "@/types/api";
import type { ApiManualReview, ApiReviewDecision } from "@/features/administration/api/types";

export async function getManualReviewsApi(): Promise<ApiManualReview[]> {
  try {
    const response = await get<ApiManualReview[]>(ENDPOINTS.ADMIN.MANUAL_REVIEWS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch manual reviews" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function approveReviewApi(id: string, data: ApiReviewDecision): Promise<void> {
  try {
    const response = await post<void>(ENDPOINTS.ADMIN.APPROVE_REVIEW(id), data);
    if (response.success) return;
    throw { code: "UNKNOWN", message: response.message || "Failed to approve review" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function rejectReviewApi(id: string, data: ApiReviewDecision): Promise<void> {
  try {
    const response = await post<void>(ENDPOINTS.ADMIN.REJECT_REVIEW(id), data);
    if (response.success) return;
    throw { code: "UNKNOWN", message: response.message || "Failed to reject review" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
