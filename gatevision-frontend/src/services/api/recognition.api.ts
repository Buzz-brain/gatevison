import { get, post, del } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type {
  ApiPipelineResult, ApiRecognitionHistoryEntry, ApiPipelineMetrics, ApiModelStatus,
} from "@/features/recognition/types/api";
import type { NormalizedError, PaginatedResponse } from "@/types/api";

export async function getRecognitionHistoryApi(
  page = 1,
  pageSize = 20,
  search?: string,
  decision?: string,
): Promise<PaginatedResponse<ApiRecognitionHistoryEntry>> {
  try {
    const params: Record<string, unknown> = { page, page_size: pageSize };
    if (search) params.search = search;
    if (decision && decision !== "all") params.decision = decision;
    const response = await get<PaginatedResponse<ApiRecognitionHistoryEntry>>(
      "/recognition/history",
      params,
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch history" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export interface DeleteHistoryResult {
  deleted_record: boolean;
  deleted_transaction: boolean;
  deleted_session: boolean;
}

export interface ClearHistoryResult {
  deleted_records: number;
  deleted_transactions: number;
  deleted_sessions: number;
}

export async function deleteRecognitionHistoryEntryApi(recordId: string): Promise<DeleteHistoryResult> {
  try {
    const response = await del<DeleteHistoryResult>(`/recognition/history/${recordId}`);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to delete history entry" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function clearRecognitionHistoryApi(): Promise<ClearHistoryResult> {
  try {
    const response = await del<ClearHistoryResult>("/recognition/history");
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to clear history" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getRecognitionResultApi(pipelineId: string): Promise<ApiPipelineResult> {  try {
    const response = await get<ApiPipelineResult>("/recognition/result", { pipeline_id: pipelineId });
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch result" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getModelStatusApi(): Promise<ApiModelStatus[]> {
  try {
    const response = await get<ApiModelStatus[]>("/recognition/models");
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch model status" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function gateEntryApi(data: {
  pipeline_id: string;
  decision: string;
  confidence: number;
}): Promise<{ session_id: string; gate_action: string; timestamp: string }> {
  try {
    const response = await post<{ session_id: string; gate_action: string; timestamp: string }>(
      ENDPOINTS.GATE.ENTRY,
      data,
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Gate entry failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function gateExitApi(data: {
  session_id: string;
}): Promise<{ session_id: string; gate_action: string; timestamp: string }> {
  try {
    const response = await post<{ session_id: string; gate_action: string; timestamp: string }>(
      ENDPOINTS.GATE.EXIT,
      data,
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Gate exit failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
