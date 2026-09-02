import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { processPipelineUploadApi, getPipelineStatusApi, getPipelineMetricsApi, processPipelineCameraApi, completePendingVehicleApi } from "@/services/api/pipeline.api";
import { getRecognitionHistoryApi, getRecognitionResultApi, getModelStatusApi, deleteRecognitionHistoryEntryApi, clearRecognitionHistoryApi } from "@/services/api/recognition.api";
import { startCameraApi, stopCameraApi, getCameraStatusApi, detectCamerasApi, type CameraStatus, type DetectCamerasResult } from "@/services/api/camera.api";
import { getPendingVehicleApi, createPendingVehicleApi, createPendingFromFrameApi, type PendingVehicleInfo } from "@/services/api/pending.api";
import { mapPipelineResult, mapHistoryEntry } from "../api/mapper";
import type { RecognitionResult, RecognitionHistoryEntry } from "../types";
import type { ApiPipelineResult, ApiPipelineStatus, ApiPipelineMetrics, ApiModelStatus } from "../types/api";

export function useProcessPipeline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { file: File; direction?: "entry" | "exit"; requireFace?: boolean; faceFile?: File; finalize?: boolean }): Promise<ApiPipelineResult> => {
      return processPipelineUploadApi(args.file, args.direction ?? "entry", undefined, args.requireFace, args.faceFile, args.finalize);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognition"] });
    },
  });
}

export function useProcessPipelineCamera() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { direction?: "entry" | "exit"; requireFace?: boolean; finalize?: boolean }): Promise<ApiPipelineResult> => {
      return processPipelineCameraApi(args.direction ?? "entry", args.requireFace, undefined, args.finalize);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognition"] });
    },
  });
}

export function useCameraStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.CAMERA.STATUS,
    queryFn: (): Promise<CameraStatus> => getCameraStatusApi(),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.is_running) return 5_000;
      return false;
    },
    retry: 2,
    staleTime: 5_000,
  });
}

export function useStartCamera() {
  const queryClient = useQueryClient();
  return useMutation<CameraStatus, unknown, number>({
    mutationFn: (source) => startCameraApi(source),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CAMERA.STATUS });
    },
  });
}

export function useStopCamera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => stopCameraApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CAMERA.STATUS });
    },
  });
}

export function useDetectCameras() {
  return useQuery({
    queryKey: ["camera", "detect"],
    queryFn: (): Promise<DetectCamerasResult> => detectCamerasApi(),
    staleTime: 60_000,
    retry: 1,
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

export function useGetPendingVehicle(direction: "entry" | "exit") {
  return useQuery({
    queryKey: QUERY_KEYS.PIPELINE.PENDING(direction),
    queryFn: (): Promise<PendingVehicleInfo | null> => getPendingVehicleApi(direction),
    staleTime: 5_000,
    retry: 1,
  });
}

export function useCreatePendingVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (direction: "entry" | "exit") => createPendingVehicleApi(direction),
    onSuccess: (pending, direction) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PIPELINE.PENDING(direction) });
      queryClient.setQueryData(QUERY_KEYS.PIPELINE.PENDING(direction), pending);
    },
  });
}

export function useCreatePendingFromFrame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: { frame: File; direction: "entry" | "exit" }): Promise<PendingVehicleInfo> => {
      return createPendingFromFrameApi(args.frame, args.direction);
    },
    onSuccess: (pending, args) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PIPELINE.PENDING(args.direction) });
      queryClient.setQueryData(QUERY_KEYS.PIPELINE.PENDING(args.direction), pending);
    },
  });
}

export function useCompletePendingVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: { pendingId: string; faceFile: File }): Promise<ApiPipelineResult> => {
      return completePendingVehicleApi(args.pendingId, args.faceFile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognition"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.TRANSACTIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.ACTIVE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.STATISTICS });
    },
  });
}
