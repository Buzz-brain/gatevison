import { post } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiEntryRequest, ApiExitRequest, ApiSessionWorkflowResult } from "@/features/gate-operations/api/types";
import type { NormalizedError } from "@/types/api";

export async function entryApi(data: ApiEntryRequest): Promise<ApiSessionWorkflowResult> {
  try {
    const response = await post<ApiSessionWorkflowResult>(ENDPOINTS.GATE.ENTRY, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Entry session failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function exitApi(data: ApiExitRequest): Promise<ApiSessionWorkflowResult> {
  try {
    const response = await post<ApiSessionWorkflowResult>(ENDPOINTS.GATE.EXIT, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Exit session failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
