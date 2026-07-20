import { useMemo } from "react";
import { useDashboardMetrics, useDashboardEvents, useSystemHealth, useSystemModels, useGateActive, useGateStatistics, usePipelineMetrics, useDecisionHistory } from "./use-dashboard-api";
import { mapModelHealth, mapGateInfo } from "../api/mapper";

interface UseDashboardReturn {
  metrics: ReturnType<typeof useDashboardMetrics>;
  events: ReturnType<typeof useDashboardEvents>;
  health: ReturnType<typeof useSystemHealth>;
  models: ReturnType<typeof useSystemModels>;
  gateActive: ReturnType<typeof useGateActive>;
  gateStats: ReturnType<typeof useGateStatistics>;
  pipeline: ReturnType<typeof usePipelineMetrics>;
  decisions: ReturnType<typeof useDecisionHistory>;
  loading: boolean;
  error: boolean;
}

function useDashboard(): UseDashboardReturn {
  const metrics = useDashboardMetrics();
  const events = useDashboardEvents();
  const health = useSystemHealth();
  const models = useSystemModels();
  const gateActive = useGateActive();
  const gateStats = useGateStatistics();
  const pipeline = usePipelineMetrics();
  const decisions = useDecisionHistory();

  const loading = useMemo(
    () => metrics.isLoading || events.isLoading || health.isLoading,
    [metrics.isLoading, events.isLoading, health.isLoading],
  );

  const error = useMemo(
    () => metrics.isError || health.isError,
    [metrics.isError, health.isError],
  );

  return {
    metrics, events, health, models, gateActive, gateStats, pipeline, decisions,
    loading, error,
  };
}

export { useDashboard };
export type { UseDashboardReturn };
