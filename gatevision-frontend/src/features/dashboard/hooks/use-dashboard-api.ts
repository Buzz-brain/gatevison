import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { getDashboardMetricsApi, getDashboardEventsApi } from "@/services/api/dashboard.api";
import { getAnalyticsApi } from "@/services/api/analytics.api";
import { getGateStatisticsApi, getGateActiveApi } from "@/services/api/gate.api";
import { getSystemHealthApi, getSystemModelsApi, getSystemPerformanceApi, getSystemStorageApi, getSystemVersionApi, getPipelineStatusApi, getPipelineMetricsApi, getCameraStatusApi } from "@/services/api/system.api";
import { getDecisionHistoryApi } from "@/services/api/event.api";
import { mapDashboardMetrics, mapActivityEvent, mapHourlyFlow, mapModelHealth, mapGateInfo } from "../api/mapper";

export function useDashboardMetrics() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.METRICS,
    queryFn: async () => {
      const res = await getDashboardMetricsApi();
      return mapDashboardMetrics(res);
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.ANALYTICS,
    queryFn: async () => {
      const res = await getAnalyticsApi();
      const hourlyFlow = (res.hourly_traffic ?? res.hourly_flow ?? []).map(mapHourlyFlow);
      const dailyTrend = res.daily_trend ?? [];
      const decBreakdown = res.decision_breakdown;
      const decisionDistribution = decBreakdown
        ? [
            { name: "Granted", value: decBreakdown.grants, color: "#22C55E" },
            { name: "Denied", value: decBreakdown.denials, color: "#EF4444" },
            { name: "Manual Review", value: decBreakdown.manual_reviews, color: "#F59E0B" },
          ]
        : (res.decision_distribution ?? []);
      return {
        hourlyFlow,
        accuracyPerCamera: res.accuracy_per_camera ?? [],
        decisionDistribution,
        trafficTrend: dailyTrend.map((d: { date?: string; hour?: string; entries: number; exits: number }) => ({
          hour: d.hour ?? d.date ?? "",
          entries: d.entries,
          exits: d.exits,
        })),
      };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useDashboardEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.EVENTS,
    queryFn: async () => {
      const res = await getDashboardEventsApi();
      return res.map(mapActivityEvent);
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.SYSTEM.HEALTH,
    queryFn: getSystemHealthApi,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useSystemModels() {
  return useQuery({
    queryKey: QUERY_KEYS.SYSTEM.MODELS,
    queryFn: getSystemModelsApi,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useSystemPerformance() {
  return useQuery({
    queryKey: QUERY_KEYS.SYSTEM.PERFORMANCE,
    queryFn: getSystemPerformanceApi,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useSystemStorage() {
  return useQuery({
    queryKey: QUERY_KEYS.SYSTEM.STORAGE,
    queryFn: getSystemStorageApi,
    refetchInterval: 120_000,
    staleTime: 60_000,
  });
}

export function useSystemVersion() {
  return useQuery({
    queryKey: QUERY_KEYS.SYSTEM.VERSION,
    queryFn: getSystemVersionApi,
    staleTime: 300_000,
  });
}

export function usePipelineStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.PIPELINE.STATUS,
    queryFn: getPipelineStatusApi,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function usePipelineMetrics() {
  return useQuery({
    queryKey: QUERY_KEYS.PIPELINE.METRICS,
    queryFn: getPipelineMetricsApi,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useCameraStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.CAMERA.STATUS,
    queryFn: getCameraStatusApi,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useGateStatistics() {
  return useQuery({
    queryKey: QUERY_KEYS.GATE.STATISTICS,
    queryFn: getGateStatisticsApi,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useGateActive() {
  return useQuery({
    queryKey: QUERY_KEYS.GATE.ACTIVE,
    queryFn: getGateActiveApi,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useDecisionHistory(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.DECISION.HISTORY(page),
    queryFn: () => getDecisionHistoryApi(page),
    refetchInterval: 30_000,
  });
}


