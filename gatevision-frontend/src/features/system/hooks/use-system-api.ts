import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { getSystemHealthApi, getSystemModelsApi, getSystemVersionApi } from "@/services/api/system.api";
import type {
  ApiSystemHealth, ApiModelHealth,
  ApiVersionInformation,
} from "../api/types";

const POLL_INTERVAL = 30000;

export function useSystemHealth() {
  return useQuery<ApiSystemHealth>({
    queryKey: QUERY_KEYS.SYSTEM.HEALTH,
    queryFn: getSystemHealthApi,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useSystemModels() {
  return useQuery<ApiModelHealth[]>({
    queryKey: QUERY_KEYS.SYSTEM.MODELS,
    queryFn: getSystemModelsApi,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useSystemVersion() {
  return useQuery<ApiVersionInformation>({
    queryKey: QUERY_KEYS.SYSTEM.VERSION,
    queryFn: getSystemVersionApi,
    refetchInterval: POLL_INTERVAL,
  });
}
