import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { getAdminDashboardApi, getAdminEventsApi } from "@/services/api/admin.api";
import { getManualReviewsApi, approveReviewApi, rejectReviewApi } from "@/services/api/manual-review.api";
import { getSystemHealthApi, getSystemModelsApi, getSystemPerformanceApi } from "@/services/api/system.api";
import { mapManualReview, mapSecurityEvent, mapAuditEntryFromEvent, mapCommandMatrix } from "../api/mapper";
import type { ApiReviewDecision } from "../api/types";

export function useAdminDashboard() {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN.DASHBOARD,
    queryFn: getAdminDashboardApi,
    refetchInterval: 30_000,
  });
}

export function useAdminReviews() {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN.REVIEWS,
    queryFn: async () => {
      const res = await getManualReviewsApi();
      return (res ?? []).map(mapManualReview);
    },
    refetchInterval: 15_000,
  });
}

export function useAdminEvents() {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN.EVENTS,
    queryFn: async () => {
      const res = await getAdminEventsApi();
      return { items: (res.items ?? []).map(mapSecurityEvent), total: res.total ?? 0 };
    },
    refetchInterval: 30_000,
  });
}

export function useAdminHealth() {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN.HEALTH,
    queryFn: getSystemHealthApi,
    refetchInterval: 30_000,
  });
}

export function useAdminModels() {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN.MODELS,
    queryFn: getSystemModelsApi,
    refetchInterval: 30_000,
  });
}

export function useAdminPerformance() {
  return useQuery({
    queryKey: QUERY_KEYS.ADMIN.PERFORMANCE,
    queryFn: getSystemPerformanceApi,
    refetchInterval: 30_000,
  });
}

export function useApproveReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApiReviewDecision }) => approveReviewApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN.REVIEWS });
    },
  });
}

export function useRejectReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApiReviewDecision }) => rejectReviewApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ADMIN.REVIEWS });
    },
  });
}
