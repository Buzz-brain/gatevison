import { get, post } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiSystemHealth, ApiModelHealth, ApiDatabaseHealth, ApiPerformanceMetrics, ApiStorageInfo, ApiConfigurationItem, ApiVersionInformation, ApiLogStatistics, ApiCleanupResult } from "@/features/system/api/types";
import type { NormalizedError } from "@/types/api";
import type { ApiPipelineStatus, ApiPipelineMetrics, ApiCameraStatus } from "@/features/dashboard/types/api";

export async function getSystemHealthApi(): Promise<ApiSystemHealth> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.SYSTEM.HEALTH);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      const components = raw.components as Record<string, { status?: string; healthy?: boolean }> | undefined;
      return {
        status: (raw.overall_status as string) || "unknown",
        version: raw.application as string || "",
        database: components?.mongodb?.status ?? "unknown",
        cameras: components?.camera?.status ?? "unknown",
        pipeline: components?.pipeline?.status ?? "unknown",
        storage: components?.storage?.status ?? "unknown",
        ai_services: components?.model_registry?.status ?? "unknown",
        uptime_seconds: raw.uptime_seconds as number ?? 0,
        timestamp: (raw.checked_at as string) || new Date().toISOString(),
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch system health" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getSystemModelsApi(): Promise<ApiModelHealth[]> {
  try {
    const response = await get<ApiModelHealth[]>(ENDPOINTS.SYSTEM.MODELS);
    if (response.success && response.data) return response.data;
    return [];
  } catch {
    return [];
  }
}

export async function getSystemDatabaseApi(): Promise<ApiDatabaseHealth> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.SYSTEM.DATABASE);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      const details = (raw.details as Record<string, unknown>) ?? {};
      return {
        status: raw.healthy ? "healthy" : "unhealthy",
        connections_active: (details.active_clients as number) ?? 0,
        connections_idle: 0,
        queries_per_second: 0,
        avg_query_time_ms: 0,
        replication_lag_ms: 0,
        size_mb: (details.database_size_mb as number) ?? 0,
        error_count: 0,
        timestamp: new Date().toISOString(),
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch database health" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getSystemPerformanceApi(): Promise<ApiPerformanceMetrics> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.SYSTEM.PERFORMANCE);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      const stageTimes = raw.avg_stage_times_ms as Record<string, number> | undefined;
      const stageTimingMs = stageTimes
        ? Object.entries(stageTimes).map(([stage, avg_ms]) => ({
            stage, avg_ms, p95_ms: avg_ms * 1.5, p99_ms: avg_ms * 2,
          }))
        : [];
      return {
        pipeline_duration_avg_ms: (raw.avg_pipeline_execution_time_ms as number) ?? 0,
        stage_timing_ms: stageTimingMs,
        success_rate: (raw.pipeline_success_rate as number) ?? 100,
        failure_rate: raw.failure_rate as number ?? 0,
        avg_processing_ms: (raw.avg_pipeline_execution_time_ms as number) ?? 0,
        slowest_stage: (raw.slowest_request_ms as string) ?? "",
        cpu_usage: raw.cpu_usage as number ?? 15,
        memory_usage: raw.memory_usage as number ?? 40,
        gpu_usage: raw.gpu_usage as number ?? 10,
        requests_per_second: raw.requests_per_second as number ?? 0,
        avg_latency_ms: (raw.avg_pipeline_execution_time_ms as number) ?? 0,
        error_rate: raw.error_rate as number ?? 0,
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch performance" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getSystemStorageInfoApi(): Promise<ApiStorageInfo> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.SYSTEM.STORAGE_INFO);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      const totalBytes = raw.upload_directory_size_bytes as number ?? 0;
      const freeBytes = raw.available_disk_space_bytes as number ?? 0;
      const totalGigabytes = Math.max(1, (totalBytes + freeBytes) / 1_073_741_824);
      return {
        total_gb: Math.round(totalGigabytes * 10) / 10,
        used_gb: Math.round((totalBytes / 1_073_741_824) * 10) / 10,
        free_gb: Math.round((freeBytes / 1_073_741_824) * 10) / 10,
        usage_pct: totalGigabytes > 0 ? Math.round((totalBytes / (totalBytes + freeBytes)) * 1000) / 10 : 0,
        upload_size_gb: Math.round((totalBytes / 1_073_741_824) * 10) / 10,
        images_count: raw.total_images as number ?? 0,
        face_crops_count: raw.total_cropped_faces as number ?? 0,
        plate_crops_count: raw.total_cropped_plates as number ?? 0,
        vehicle_images_count: raw.total_vehicle_images as number ?? 0,
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch storage info" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getSystemConfigurationApi(): Promise<ApiConfigurationItem[]> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.SYSTEM.CONFIGURATION);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      const settings = raw.settings as Record<string, unknown> ?? {};
      const items: ApiConfigurationItem[] = [];
      const flatten = (obj: Record<string, unknown>, prefix = "") => {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            flatten(value as Record<string, unknown>, fullKey);
          } else {
            items.push({
              key: fullKey,
              value: Array.isArray(value) ? value.join(", ") : String(value ?? ""),
              description: "",
              editable: true,
              category: prefix || "General",
            });
          }
        }
      };
      flatten(settings);
      return items;
    }
    return [];
  } catch {
    return [];
  }
}

export async function getSystemVersionApi(): Promise<ApiVersionInformation> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.SYSTEM.VERSION);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      const libs = (raw.ai_libraries as Record<string, string> | undefined) ?? {};
      return {
        version: (raw.version as string) || "",
        python: (raw.python_version as string) || "3.10",
        fastapi: (raw.fastapi_version as string) || "",
        mongodb: (raw.mongodb_version as string) || "",
        opencv: libs.opencv ?? "",
        pytorch: libs.torch ?? "",
        yolo: libs.ultralytics ?? "",
        easyocr: libs.easyocr ?? "",
        built_at: (raw.build_timestamp as string) || "",
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch version info" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getSystemLogStatisticsApi(): Promise<ApiLogStatistics> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.SYSTEM.LOG_STATISTICS);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      const severities = (raw.severity_counts as Record<string, number>) ?? {};
      return {
        errors: (severities.error ?? severities.errors ?? raw.errors_last_24h as number ?? 0),
        warnings: (severities.warning ?? severities.warnings ?? 0),
        critical: (severities.critical ?? severities.crit ?? 0),
        info: (severities.info ?? 0),
        startup: 0,
        shutdown: 0,
        model_loads: 0,
        decision_overrides: 0,
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch log statistics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getSystemCleanupApi(): Promise<ApiCleanupResult> {
  try {
    const response = await post<ApiCleanupResult>(ENDPOINTS.SYSTEM.CLEANUP);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch cleanup info" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

/* Re-exported for dashboard and gate-operations compatibility */
export async function getSystemStorageApi(): Promise<ApiStorageInfo> {
  return getSystemStorageInfoApi();
}

export async function getPipelineStatusApi(): Promise<ApiPipelineStatus> {
  try {
    const response = await get<ApiPipelineStatus>(ENDPOINTS.PIPELINE.STATUS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch pipeline status" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getPipelineMetricsApi(): Promise<ApiPipelineMetrics> {
  try {
    const response = await get<ApiPipelineMetrics>(ENDPOINTS.PIPELINE.METRICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch pipeline metrics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getCameraStatusApi(): Promise<ApiCameraStatus> {
  try {
    const response = await get<ApiCameraStatus>(ENDPOINTS.CAMERA.STATUS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch camera status" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
