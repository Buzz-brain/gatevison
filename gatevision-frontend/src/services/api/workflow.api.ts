import { post } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiEntryRequest, ApiWorkflowResult } from "@/features/gate-operations/api/types";
import type { NormalizedError } from "@/types/api";

interface ApiExitRequest {
  plate: string;
  gate_id: string;
}

export async function entryApi(data: ApiEntryRequest): Promise<ApiWorkflowResult> {
  try {
    const response = await post<ApiWorkflowResult>(ENDPOINTS.GATE.ENTRY, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Entry failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function exitApi(data: ApiExitRequest): Promise<ApiWorkflowResult> {
  try {
    const response = await post<ApiWorkflowResult>(ENDPOINTS.GATE.EXIT, data);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Exit failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
