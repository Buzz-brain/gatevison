export interface SystemHealth {
  overall_status: "healthy" | "degraded" | "unhealthy";
  components: Record<string, ComponentHealth>;
  checked_at: string;
}

export interface ComponentHealth {
  healthy: boolean;
  status: string;
  message: string;
}

export interface ModelInfo {
  name: string;
  model_type: string;
  loaded: boolean;
  device: string;
  version: string;
  total_inference_count: number;
  avg_inference_time_ms: number;
  error_count: number;
}

export interface PerformanceMetrics {
  avg_pipeline_execution_time_ms: number;
  total_processed_requests: number;
  failed_requests: number;
  pipeline_success_rate: number;
  avg_stage_times_ms: Record<string, number>;
}
