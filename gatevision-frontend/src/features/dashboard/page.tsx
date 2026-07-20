import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { SectionHeader } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import {
  useDashboardMetrics, useDashboardEvents, useSystemHealth, useSystemModels,
  useGateStatistics, useDecisionHistory, useAnalytics, usePipelineStatus, useCameraStatus,
} from "./hooks/use-dashboard-api";
import { MetricGrid } from "./components/metric-grid";
import { LiveCamera } from "./components/live-camera";
import { AiTimeline } from "./components/ai-timeline";
import { ActivityFeed } from "./components/activity-feed";
import { IncidentPanel } from "./components/incident-panel";
import { HealthGrid } from "./components/health-grid";
import { AnalyticsCharts } from "./components/analytics";
import { GateStatusPanel } from "./components/gate-status";
import { RecentDecisionsTable } from "./components/decision-table";
import { QuickActions } from "./components/quick-actions";
import { AIStatusCard } from "./components/ai-status";
import { WeatherWidget } from "./components/weather-widget";
import { CommandMap } from "./components/command-map";
import { MissionReplay } from "./components/mission-replay";
import { LiveOperationsBriefing } from "./components/live-operations-briefing";
import type { Incident } from "./types";

function DashboardPage() {
  const [dismissedIncidents, setDismissedIncidents] = useState<Set<string>>(new Set());
  const prefersReduced = useReducedMotion();

  const { data: metrics, isLoading: metricsLoading, isError: metricsError } = useDashboardMetrics();
  const { data: events = [], isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useDashboardEvents();
  const { data: health, isLoading: healthLoading, isError: healthError } = useSystemHealth();
  const { data: models, isLoading: modelsLoading } = useSystemModels();
  const { data: gateStats, isLoading: gateStatsLoading } = useGateStatistics();
  const { data: decisions, isLoading: decisionsLoading, isError: decisionsError, refetch: refetchDecisions } = useDecisionHistory();
  const pipelineStatus = usePipelineStatus();
  const cameraStatus = useCameraStatus();

  const isLoaded = useMemo(
    () => !metricsLoading && !healthLoading && !gateStatsLoading && !modelsLoading && !decisionsLoading && !eventsLoading,
    [metricsLoading, healthLoading, gateStatsLoading, modelsLoading, decisionsLoading, eventsLoading],
  );

  const allIncidents = useMemo((): Incident[] => {
    const result: Incident[] = [];
    if (dismissedIncidents) { }

    const dismissed = dismissedIncidents;

    if (decisions?.items) {
      decisions.items.forEach((d) => {
        if (d.decision === "denied") {
          const id = `inc-denied-${d.id}`;
          if (!dismissed.has(id)) {
            result.push({
              id,
              severity: "critical",
              title: "Access Denied",
              description: `Vehicle ${d.plate} — ${d.driver} confidence ${d.confidence.toFixed(1)}%`,
              timestamp: d.timestamp,
              category: "low_confidence",
              actionLabel: "Review",
            });
          }
        } else if (d.decision === "manual_review") {
          const id = `inc-review-${d.id}`;
          if (!dismissed.has(id)) {
            result.push({
              id,
              severity: "high",
              title: "Manual Review Required",
              description: `Vehicle ${d.plate} — ${d.driver} requires identity verification`,
              timestamp: d.timestamp,
              category: "manual_review",
              actionLabel: "Review Now",
            });
          }
        }
      });
    }

    if (pipelineStatus?.data?.status && pipelineStatus.data.status !== "running") {
      const id = "inc-pipeline";
      if (!dismissed.has(id)) {
        result.push({
          id,
          severity: "critical",
          title: "Pipeline Failure",
          description: `Recognition pipeline is ${pipelineStatus.data.status} — check infrastructure`,
          timestamp: new Date().toISOString(),
          category: "system",
          actionLabel: "Diagnose",
        });
      }
    }

    if (cameraStatus?.data && cameraStatus.data.status !== "online") {
      const id = "inc-camera";
      if (!dismissed.has(id)) {
        result.push({
          id,
          severity: "critical",
          title: "Camera Offline",
          description: `${cameraStatus.data.name} — ${cameraStatus.data.gate} has no signal`,
          timestamp: new Date().toISOString(),
          category: "camera_offline",
          actionLabel: "Diagnose",
        });
      }
    }

    events.slice(0, 10).forEach((e) => {
      if (e.type === "alert" || e.type === "warning") {
        const id = `inc-ev-${e.id}`;
        if (!dismissed.has(id)) {
          result.push({
            id,
            severity: "medium",
            title: e.type === "alert" ? "System Alert" : "Warning",
            description: e.message,
            timestamp: e.timestamp,
            category: "system",
          });
        }
      }
    });

    return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [decisions, pipelineStatus?.data, cameraStatus?.data, events, dismissedIncidents]);

  const incidentsLoading = decisionsLoading || eventsLoading;
  const incidentsError = decisionsError || eventsError;

  const retryIncidents = useCallback(() => {
    refetchDecisions();
    refetchEvents();
  }, [refetchDecisions, refetchEvents]);

  const dismissIncident = useCallback((id: string) => {
    setDismissedIncidents((prev) => new Set(prev).add(id));
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <SectionHeader
        title="Security Operations Center"
        description={`Live status — ${new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })} — ${new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}`}
      />

      <motion.div
        initial={prefersReduced ? undefined : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {isLoaded ? <LiveOperationsBriefing /> : <Skeleton className="h-[200px] rounded-xl" />}
      </motion.div>

      <motion.div
        initial={prefersReduced ? undefined : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {isLoaded ? <MetricGrid /> : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoaded ? <LiveCamera /> : <Skeleton className="h-[320px] rounded-xl" />}
        </div>
        <div>
          {isLoaded ? <AiTimeline /> : <Skeleton className="h-[320px] rounded-xl" />}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoaded ? <ActivityFeed /> : <Skeleton className="h-[300px] rounded-xl" />}
        </div>
        <div>
          {isLoaded ? (
            <IncidentPanel
              incidents={allIncidents}
              onDismiss={dismissIncident}
              isLoading={incidentsLoading}
              isError={incidentsError}
              onRetry={retryIncidents}
            />
          ) : (
            <Skeleton className="h-[300px] rounded-xl" />
          )}
        </div>
      </div>

      {isLoaded ? <HealthGrid /> : <Skeleton className="h-[120px] rounded-xl" />}

      {isLoaded ? <AnalyticsCharts /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[260px] rounded-xl sm:col-span-2" />
          <Skeleton className="h-[260px] rounded-xl" />
          <Skeleton className="h-[240px] rounded-xl sm:col-span-2" />
          <Skeleton className="h-[240px] rounded-xl" />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          {isLoaded ? <GateStatusPanel /> : <Skeleton className="h-[280px] rounded-xl" />}
        </div>
        <div className="lg:col-span-2">
          {isLoaded ? <RecentDecisionsTable /> : <Skeleton className="h-[280px] rounded-xl" />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoaded ? (
          <>
            <QuickActions />
            <AIStatusCard />
            <WeatherWidget />
            <MissionReplay />
            <CommandMap />
          </>
        ) : (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))
        )}
      </div>
    </div>
  );
}

export { DashboardPage };
