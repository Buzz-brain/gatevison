import { useMemo } from "react";
import {
  useSystemHealth, useSystemModels,
  useSystemVersion,
} from "./use-system-api";
import {
  mapOverallHealth, mapAiModels, mapVersionInfo,
} from "../api/mapper";

export function useSystem() {
  const healthQ = useSystemHealth();
  const modelsQ = useSystemModels();
  const versionQ = useSystemVersion();

  const isLoading = healthQ.isLoading || modelsQ.isLoading || versionQ.isLoading;
  const isError = healthQ.isError || modelsQ.isError || versionQ.isError;

  const health = useMemo(() => healthQ.data ? mapOverallHealth(healthQ.data) : { status: "healthy" as const, score: 99, services: [] }, [healthQ.data]);
  const models = useMemo(() => modelsQ.data ? mapAiModels(modelsQ.data) : [], [modelsQ.data]);
  const versions = useMemo(() => versionQ.data ? mapVersionInfo(versionQ.data) : [], [versionQ.data]);

  return {
    health,
    models,
    versions,
    isLoading,
    isError,
  };
}

export type SystemApi = ReturnType<typeof useSystem>;
