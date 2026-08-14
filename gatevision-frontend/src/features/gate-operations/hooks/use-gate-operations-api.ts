import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { forceCloseSessionApi, getActiveSessionsApi } from "@/services/api/gate-session.api";
import { entryApi, exitApi } from "@/services/api/workflow.api";
import { getSystemHealthApi, getCameraStatusApi } from "@/services/api/system.api";
import { mapActiveVehicle } from "../api/mapper";
import type { ApiEntryRequest, ApiExitRequest } from "../api/types";

export function useActiveSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.GATE.ACTIVE,
    queryFn: getActiveSessionsApi,
    refetchInterval: 5_000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.SYSTEM.HEALTH,
    queryFn: getSystemHealthApi,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useCameraStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.CAMERA.STATUS,
    queryFn: getCameraStatusApi,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

function invalidateGateQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.ACTIVE });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.STATISTICS });
  queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.GATE.TRANSACTIONS] });
}

export function useEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApiEntryRequest) => entryApi(data),
    onSuccess: () => invalidateGateQueries(queryClient),
  });
}

export function useExitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApiExitRequest) => exitApi(data),
    onSuccess: () => invalidateGateQueries(queryClient),
  });
}

export function useForceCloseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vehicleId: string) => forceCloseSessionApi(vehicleId),
    onSuccess: () => invalidateGateQueries(queryClient),
  });
}
