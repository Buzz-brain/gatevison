import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { startCameraApi, stopCameraApi, getCameraStatusApi, captureCameraApi } from "@/services/api/camera.api";
import type { ApiCameraStatus } from "../types/api";

export function useCameraStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.CAMERA.STATUS,
    queryFn: (): Promise<ApiCameraStatus> => getCameraStatusApi(),
    refetchInterval: 5_000,
    staleTime: 2_000,
    retry: 3,
  });
}

export function useStartCamera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startCameraApi(),
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

export function useCaptureCamera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => captureCameraApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recognition"] });
    },
  });
}
