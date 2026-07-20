import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { getSystemHealthApi, getSystemModelsApi, getSystemDatabaseApi, getSystemPerformanceApi, getSystemStorageInfoApi, getSystemConfigurationApi, getSystemVersionApi, getSystemLogStatisticsApi, getSystemCleanupApi } from "@/services/api/system.api";
import { getBackupsApi, exportBackupApi, importBackupApi } from "@/services/api/backup.api";
import type {
  ApiSystemHealth, ApiModelHealth, ApiDatabaseHealth, ApiPerformanceMetrics,
  ApiStorageInfo, ApiConfigurationItem, ApiVersionInformation, ApiLogStatistics,
  ApiCleanupResult, ApiBackupRecord,
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

export function useSystemDatabase() {
  return useQuery<ApiDatabaseHealth>({
    queryKey: QUERY_KEYS.SYSTEM.DATABASE,
    queryFn: getSystemDatabaseApi,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useSystemPerformance() {
  return useQuery<ApiPerformanceMetrics>({
    queryKey: QUERY_KEYS.SYSTEM.PERFORMANCE,
    queryFn: getSystemPerformanceApi,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useSystemStorageInfo() {
  return useQuery<ApiStorageInfo>({
    queryKey: QUERY_KEYS.SYSTEM.STORAGE_INFO,
    queryFn: getSystemStorageInfoApi,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useSystemConfiguration() {
  return useQuery<ApiConfigurationItem[]>({
    queryKey: QUERY_KEYS.SYSTEM.CONFIGURATION,
    queryFn: getSystemConfigurationApi,
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

export function useSystemLogStatistics() {
  return useQuery<ApiLogStatistics>({
    queryKey: QUERY_KEYS.SYSTEM.LOG_STATISTICS,
    queryFn: getSystemLogStatisticsApi,
    refetchInterval: POLL_INTERVAL,
  });
}

export function useSystemBackups() {
  return useQuery<ApiBackupRecord[]>({
    queryKey: QUERY_KEYS.SYSTEM.BACKUPS,
    queryFn: getBackupsApi,
    refetchInterval: 60000,
  });
}

export function useSystemCleanup() {
  return useQuery<ApiCleanupResult>({
    queryKey: ["system", "cleanup-preview"],
    queryFn: getSystemCleanupApi,
    staleTime: 120_000,
  });
}

export function useExportBackupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: exportBackupApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SYSTEM.BACKUPS });
    },
  });
}

export function useImportBackupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (backupId: string) => importBackupApi(backupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.SYSTEM.BACKUPS });
    },
  });
}
