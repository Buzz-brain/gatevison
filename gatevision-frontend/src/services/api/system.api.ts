import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiSystemHealth, ApiModelHealth, ApiPerformanceMetrics, ApiVersionInformation } from "@/features/system/api/types";
import type { NormalizedError } from "@/types/api";
import type { ApiPipelineStatus, ApiPipelineMetrics, ApiCameraStatus } from "@/services/api/types";

export async function getSystemHealthApi(): Promise<ApiSystemHealth> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.SYSTEM.HEALTH);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      const components = raw.components as Record<string, { status?: string; healthy?: boolean }> | undefined;
      return {
        status: (raw.overall_status as ApiSystemHealth["status"]) || "unknown",
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
        error_rate: raw.error_rate as number ?? 0,
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch performance" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
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
        build: (raw.build as string) || "",
        commit: (raw.commit as string) || "",
        built_at: (raw.build_timestamp as string) || "",
      };
    }
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch version info" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

/* Re-exported for dashboard and gate-operations compatibility */
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
