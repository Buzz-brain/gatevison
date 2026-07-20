import { useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useSystemHealth, useSystemModels } from "../hooks/use-dashboard-api";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const statusConfig: Record<string, { dot: string; bg: string; border: string }> = {
  healthy: { dot: "bg-success", bg: "bg-success/5", border: "border-success/20" },
  degraded: { dot: "bg-warning", bg: "bg-warning/5", border: "border-warning/20" },
  unhealthy: { dot: "bg-danger", bg: "bg-danger/5", border: "border-danger/20" },
  loaded: { dot: "bg-success", bg: "bg-success/5", border: "border-success/20" },
  connected: { dot: "bg-success", bg: "bg-success/5", border: "border-success/20" },
  disconnected: { dot: "bg-danger", bg: "bg-danger/5", border: "border-danger/20" },
  running: { dot: "bg-success", bg: "bg-success/5", border: "border-success/20" },
  stopped: { dot: "bg-danger", bg: "bg-danger/5", border: "border-danger/20" },
  online: { dot: "bg-success", bg: "bg-success/5", border: "border-success/20" },
  offline: { dot: "bg-danger", bg: "bg-danger/5", border: "border-danger/20" },
};

function HealthGrid() {
  const { data: health, isLoading: healthLoading, isError: healthError, refetch: refetchHealth } = useSystemHealth();
  const { data: models, isLoading: modelsLoading, isError: modelsError, refetch: refetchModels } = useSystemModels();
  const prefersReduced = useReducedMotion();

  const modules = useMemo(() => {
    const result: { id: string; name: string; status: string; latency: string; heartbeat: string }[] = [];
    if (health) {
      result.push({ id: "sys-health", name: "System", status: health.status, latency: health.status === "healthy" ? "OK" : health.status, heartbeat: health.timestamp });
      result.push({ id: "sys-db", name: "Database", status: health.database, latency: health.database === "connected" ? "OK" : "FAIL", heartbeat: health.timestamp });
      if (health.storage) result.push({ id: "sys-storage", name: "Storage", status: health.storage, latency: health.storage === "healthy" ? "OK" : health.storage, heartbeat: health.timestamp });
      if (health.pipeline) result.push({ id: "sys-pipeline", name: "Pipeline", status: health.pipeline, latency: health.pipeline === "healthy" ? "OK" : health.pipeline, heartbeat: health.timestamp });
      if (health.ai_services) result.push({ id: "sys-ai", name: "AI Services", status: health.ai_services, latency: health.ai_services === "healthy" ? "OK" : health.ai_services, heartbeat: health.timestamp });
      if (health.cameras) result.push({ id: "sys-cam", name: "Cameras", status: health.cameras, latency: health.cameras === "healthy" ? "OK" : health.cameras, heartbeat: health.timestamp });
    }
    if (models) {
      models.forEach((m, i) => {
        result.push({
          id: m.id || `model-${i}`,
          name: m.name,
          status: m.status,
          latency: `${m.avg_latency_ms}ms`,
          heartbeat: m.last_loaded,
        });
      });
    }
    return result;
  }, [health, models]);

  const isLoading = healthLoading || modelsLoading;
  const isError = healthError || modelsError;

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="h-4 w-24 bg-muted rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-medium">System Health</h3>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-xs text-muted-foreground">Failed to load system health</p>
          <button onClick={() => { refetchHealth(); refetchModels(); }} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </Card>
    );
  }

  if (modules.length === 0) return null;

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-medium">System Health</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {modules.map((mod, i) => {
          const cfg = (statusConfig[mod.status] ?? statusConfig.healthy)!;
          return (
            <motion.div
              key={mod.id}
              initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className={cn("rounded-lg border p-3 transition-colors", cfg.border, cfg.bg)}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                <span className="text-xs font-medium">{mod.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground/60">{mod.name.includes("System") || mod.name.includes("Database") || mod.name.includes("Storage") || mod.name.includes("Pipeline") || mod.name.includes("AI") || mod.name.includes("Camera") ? "Status" : "Latency"}</span>
                <span className={cn("text-[10px] font-mono", mod.latency === "OK" ? "text-success" : mod.latency === "FAIL" ? "text-danger" : mod.status !== "healthy" ? "text-warning" : "text-muted-foreground")}>
                  {mod.latency}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] text-muted-foreground/60">Updated</span>
                <span className="text-[10px] text-muted-foreground/40 font-mono">
                  {mod.heartbeat ? new Date(mod.heartbeat).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "-"}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

export { HealthGrid };
