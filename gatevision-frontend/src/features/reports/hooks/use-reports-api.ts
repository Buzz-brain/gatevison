import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { getReportsApi, searchReportsApi, getManualReviewsApi, getEventsApi } from "@/services/api/reports.api";
import { getReportsAnalyticsApi } from "@/services/api/analytics.api";
import { exportReportsApi } from "@/services/api/export.api";
import { getDecisionHistoryApi } from "@/services/api/event.api";
import { getGateStatisticsApi } from "@/services/api/gate.api";
import {
  mapReportRecord, mapAnalyticsSummary, mapSearchResult,
  mapManualReviewSummary, mapEventSummary, mapDecisionHistoryItem,
} from "../api/mapper";
import type { ApiDecisionHistoryItem } from "@/features/dashboard/types/api";

export function useApiReports(params?: {
  page?: number;
  type?: string;
  date_from?: string;
  date_to?: string;
  driver?: string;
  vehicle?: string;
  plate?: string;
  decision?: string;
  manual_review?: string;
  gate?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: string;
}) {
  const paramStr = JSON.stringify(params ?? {});
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS.ALL(paramStr),
    queryFn: async () => {
      const res = await getReportsApi(params);
      return {
        items: (res.items ?? []).map(mapReportRecord),
        total: res.total ?? 0,
        page: res.page ?? 1,
        pageSize: res.pageSize ?? 50,
        totalPages: res.totalPages ?? 1,
      };
    },
  });
}

export function useApiAnalytics() {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS.ANALYTICS,
    queryFn: async () => {
      const res = await getReportsAnalyticsApi();
      return mapAnalyticsSummary(res);
    },
    refetchInterval: 30_000,
  });
}

export function useApiSearch(query: string) {
  return useQuery({
    queryKey: ["reports", "search", query],
    queryFn: async () => {
      const res = await searchReportsApi({ q: query });
      return (res.items ?? []).map(mapSearchResult);
    },
    enabled: query.length >= 2,
    staleTime: 10_000,
  });
}

export function useApiManualReviews(status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.REPORTS.MANUAL_REVIEWS, status],
    queryFn: async () => {
      const res = await getManualReviewsApi({ status });
      return (res.items ?? []).map(mapManualReviewSummary);
    },
  });
}

export function useApiEvents(page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEYS.REPORTS.EVENTS, page],
    queryFn: async () => {
      const res = await getEventsApi({ page });
      return { items: (res.items ?? []).map(mapEventSummary), total: res.total ?? 0 };
    },
    refetchInterval: 30_000,
  });
}

export function useApiDecisionHistory(page = 1) {
  return useQuery({
    queryKey: QUERY_KEYS.REPORTS.DECISION_HISTORY(page),
    queryFn: async () => {
      const res = await getDecisionHistoryApi(page);
      return {
        items: (res.items ?? []).map(mapDecisionHistoryItem),
        total: res.total ?? 0,
        page: res.page ?? page,
        pageSize: res.pageSize ?? 50,
        totalPages: res.totalPages ?? 1,
      };
    },
    refetchInterval: 30_000,
  });
}

export function useApiGateStatistics() {
  return useQuery({
    queryKey: QUERY_KEYS.GATE.STATISTICS,
    queryFn: getGateStatisticsApi,
    refetchInterval: 30_000,
  });
}

export function useApiExportMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { format: "csv" | "json" | "excel"; report_type?: string; date_from?: string; date_to?: string }) =>
      exportReportsApi(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.EXPORT });
    },
  });
}
