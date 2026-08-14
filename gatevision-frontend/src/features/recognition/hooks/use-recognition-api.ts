import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { processPipelineUploadApi, getPipelineStatusApi, getPipelineMetricsApi } from "@/services/api/pipeline.api";
import { getRecognitionHistoryApi, getRecognitionResultApi, getModelStatusApi, deleteRecognitionHistoryEntryApi, clearRecognitionHistoryApi } from "@/services/api/recognition.api";
import { mapPipelineResult, mapHistoryEntry } from "../api/mapper";
import type { RecognitionResult, RecognitionHistoryEntry } from "../types";
import type { ApiPipelineResult, ApiPipelineStatus, ApiPipelineMetrics, ApiModelStatus } from "../types/api";

export function useProcessPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { file: File; direction?: "entry" | "exit"; requireFace?: boolean; faceFile?: File }): Promise<ApiPipelineResult> => {
      return processPipelineUploadApi(args.file, args.direction ?? "entry", undefined, args.requireFace, args.faceFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognition"] });
    },
  });
}

export function usePipelineStatus(pipelineId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.RECOGNITION.PIPELINE_STATUS(pipelineId ?? ""),
    queryFn: () => getPipelineStatusApi(pipelineId!),
    enabled: !!pipelineId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === "completed" || data.status === "failed" || data.status === "manual_review") {
        return false;
      }
      return 500;
    },
    retry: 3,
    staleTime: 0,
  });
}

export function useRecognitionResult(pipelineId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.RECOGNITION.RESULT(pipelineId ?? ""),
    queryFn: async (): Promise<RecognitionResult> => {
      const data = await getRecognitionResultApi(pipelineId!);
      return mapPipelineResult(data);
    },
    enabled: false, // only fetch when triggered manually
    retry: 1,
    staleTime: Infinity,
  });
}

export function useRecognitionHistory(page = 1, search?: string, decision?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.RECOGNITION.HISTORY(page, search, decision),
    queryFn: async () => {
      const data = await getRecognitionHistoryApi(page, 20, search, decision);
      return {
        entries: data.items.map(mapHistoryEntry),
        total: data.total,
        page: data.page,
        pageSize: (data as any).page_size ?? data.pageSize,
        totalPages: (data as any).total_pages ?? data.totalPages,
      };
    },
    staleTime: 10_000,
  });
}

export function useDeleteHistoryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) => deleteRecognitionHistoryEntryApi(recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognition", "history"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.TRANSACTIONS });
    },
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => clearRecognitionHistoryApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognition", "history"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.TRANSACTIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.STATISTICS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.ACTIVE });
    },
  });
}

export function usePipelineMetrics() {
  return useQuery({
    queryKey: QUERY_KEYS.RECOGNITION.PIPELINE_METRICS,
    queryFn: (): Promise<ApiPipelineMetrics> => getPipelineMetricsApi(),
    staleTime: 15_000,
    retry: 2,
  });
}

export function useModelStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.RECOGNITION.MODELS,
    queryFn: (): Promise<ApiModelStatus[]> => getModelStatusApi(),
    staleTime: 30_000,
    retry: 2,
  });
}
