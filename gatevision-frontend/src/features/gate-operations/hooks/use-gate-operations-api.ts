import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { getActiveSessionsApi } from "@/services/api/gate-session.api";
import { getTransactionsApi, getGateStatisticsApi, getVehicleHistoryApi } from "@/services/api/gate-transaction.api";
import { entryApi, exitApi } from "@/services/api/workflow.api";
import { getPipelineStatusApi, getPipelineMetricsApi, getSystemHealthApi } from "@/services/api/system.api";
import { mapTransaction, mapActiveVehicle } from "../api/mapper";
import type { ApiEntryRequest } from "../api/types";

export function useActiveSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.GATE.ACTIVE,
    queryFn: async () => {
      const res = await getActiveSessionsApi();
      return {
        gates: res.gates ?? [],
        totalVehiclesInside: res.total_vehicles_inside ?? 0,
        activeVehicles: (res.gates ?? [])
          .filter((g) => g.current_vehicle)
          .map((g) => ({
            id: `av-${g.id}`,
            plate: g.current_vehicle ?? "",
            driver: undefined as string | undefined,
            vehicle: undefined as string | undefined,
            gate: g.name,
            entryTime: g.last_activity,
            durationMs: 0,
            status: "parked" as const,
          })),
      };
    },
    refetchInterval: 5_000,
  });
}

export function useTransactions(page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEYS.GATE.TRANSACTIONS, page],
    queryFn: async () => {
      const res = await getTransactionsApi(page);
      return {
        items: (res.items ?? []).map(mapTransaction),
        total: res.total ?? 0,
        page: res.page ?? page,
        pageSize: res.pageSize ?? 50,
        pages: res.totalPages ?? 1,
      };
    },
    refetchInterval: 10_000,
  });
}

export function useGateStatistics() {
  return useQuery({
    queryKey: QUERY_KEYS.GATE.STATISTICS,
    queryFn: getGateStatisticsApi,
    refetchInterval: 15_000,
  });
}

export function useVehicleHistory(vehicleId: string | null) {
  return useQuery({
    queryKey: ["gate", "history", vehicleId],
    queryFn: () => getVehicleHistoryApi(vehicleId!),
    enabled: !!vehicleId,
  });
}

export function usePipelineStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.PIPELINE.STATUS,
    queryFn: getPipelineStatusApi,
    refetchInterval: 5_000,
  });
}

export function usePipelineMetrics() {
  return useQuery({
    queryKey: QUERY_KEYS.PIPELINE.METRICS,
    queryFn: getPipelineMetricsApi,
    refetchInterval: 5_000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.SYSTEM.HEALTH,
    queryFn: getSystemHealthApi,
    refetchInterval: 30_000,
  });
}

export function useEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ApiEntryRequest) => entryApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.ACTIVE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.STATISTICS });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.GATE.TRANSACTIONS] });
    },
  });
}

export function useExitMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { plate: string; gate_id: string }) => exitApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.ACTIVE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GATE.STATISTICS });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.GATE.TRANSACTIONS] });
    },
  });
}
