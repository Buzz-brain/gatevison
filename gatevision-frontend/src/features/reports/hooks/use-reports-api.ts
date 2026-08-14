import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { getReportsApi, getManualReviewsApi } from "@/services/api/reports.api";
import { getReportsAnalyticsApi } from "@/services/api/analytics.api";
import {
  mapReportRecord, mapAnalyticsSummary,
  mapManualReviewSummary,
} from "../api/mapper";

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

export function useApiManualReviews(status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.REPORTS.MANUAL_REVIEWS, status],
    queryFn: async () => {
      const res = await getManualReviewsApi({ status });
      return (res.items ?? []).map(mapManualReviewSummary);
    },
  });
}
