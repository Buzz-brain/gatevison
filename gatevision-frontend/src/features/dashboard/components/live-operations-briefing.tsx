import { motion } from "framer-motion";
import {
  Shield, Car, LogIn, LogOut, Clock, Target, Activity,
  AlertTriangle, Eye, Camera, Database, BrainCircuit, TrendingUp, TrendingDown, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardMetrics, useSystemHealth, useSystemModels, useGateActive, usePipelineMetrics, useDashboardEvents } from "../hooks/use-dashboard-api";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface BriefingItem {
  label: string;
  value: string;
  icon: typeof Shield;
  color: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
}

function useLiveTick(intervalMs = 30000) {
  const { data: metrics, isLoading: mLoading, isError: mError } = useDashboardMetrics();
  const { data: health, isLoading: hLoading, isError: hError } = useSystemHealth();
  const { data: models, isLoading: modLoading, isError: modError } = useSystemModels();
  const { data: gateActive, isLoading: gLoading, isError: gError } = useGateActive();
  const { data: pipeline, isLoading: pLoading, isError: pError } = usePipelineMetrics();
  const { data: events, isLoading: eLoading, isError: eError } = useDashboardEvents();
  const isLoading = mLoading || hLoading || modLoading || gLoading || pLoading || eLoading;
  const isError = mError || hError || modError || gError || pError || eError;
  return { metrics, health, models, gateActive, pipeline, events, isLoading, isError };
}

function recommendations(
  metrics: any, health: any, models: any, events: any[], pipeline: any,
): string[] {
  const recs: string[] = [];
  const denied = events?.filter((e: any) => e.type === "denied").length ?? 0;
  const reviews = events?.filter((e: any) => e.type === "manual_review" || e.type === "review").length ?? 0;
  if (denied > 3) recs.push(`High denial rate (${denied} in last hour) -- verify gate configurations`);
  if (reviews > 2) recs.push(`Manual reviews increased (${reviews}) -- consider assigning additional personnel`);
  if (models?.some((m: any) => m.status !== "healthy")) {
    const degraded = models.filter((m: any) => m.status !== "healthy").map((m: any) => m.name).join(", ");
    recs.push(`Model health degraded: ${degraded} -- restart recommended`);
  }
  if (health?.status !== "healthy") recs.push("System health degraded -- check infrastructure");
  if (pipeline?.avg_processing_ms && pipeline.avg_processing_ms > 1000) {
    recs.push(`Pipeline latency elevated (${pipeline.avg_processing_ms}ms) -- scale workers`);
  }
  if (recs.length === 0) recs.push("All systems nominal -- no recommendations");
  return recs.slice(0, 3);
}

function riskLevel(health: any, models: any, pipeline: any): { label: string; variant: "success" | "warning" | "danger" } {
  if (health?.status === "unhealthy") return { label: "Critical", variant: "danger" };
  if (health?.status === "degraded" || models?.some((m: any) => m.status !== "healthy")) return { label: "Elevated", variant: "warning" };
  return { label: "Normal", variant: "success" };
}

function LiveOperationsBriefing() {
  const prefersReduced = useReducedMotion();
  const { metrics, health, models, gateActive, pipeline, events, isLoading, isError } = useLiveTick();
  const recs = recommendations(metrics, health, models, events ?? [], pipeline);
  const risk = riskLevel(health, models, pipeline);
  const deniedCount = events?.filter((e: any) => e.type === "denied").length ?? 0;
  const reviewCount = events?.filter((e: any) => e.type === "manual_review" || e.type === "review").length ?? 0;
  const vehiclesInside = gateActive?.total_vehicles_inside ?? 0;
  const modelHealth = models?.filter((m: any) => m.status === "healthy").length ?? 0;
  const totalModels = models?.length ?? 0;

  const items: BriefingItem[] = [
    { label: "Vehicles Inside", value: vehiclesInside.toString(), icon: Car, color: "text-primary", trend: "stable" },
    { label: "Entries Today", value: (metrics?.entries ?? 0).toLocaleString(), icon: LogIn, color: "text-success", trend: "up" },
    { label: "Exits Today", value: (metrics?.exits ?? 0).toLocaleString(), icon: LogOut, color: "text-info", trend: "up" },
    { label: "Recognition Accuracy", value: `${(metrics?.recognitionAccuracy ?? 0).toFixed(1)}%`, icon: Target, color: "text-success", trend: "stable" },
    { label: "Avg Processing", value: `${metrics?.avgProcessingTime ?? 0}ms`, icon: Clock, color: "text-warning", trend: "down", trendValue: "faster" },
    { label: "AI Models", value: `${modelHealth}/${totalModels}`, icon: BrainCircuit, color: modelHealth === totalModels ? "text-success" : "text-warning" },
  ];

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-elevated via-elevated to-elevated/80">
        <div className="p-5">
          <div className="h-5 w-48 bg-muted/40 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-elevated via-elevated to-elevated/80">
      <div className="relative p-5">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-primary/[0.03]" />
        <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-primary/[0.02]" />

        <div className="relative">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Operations Briefing</h3>
                <p className="text-[10px] text-muted-foreground/60">Real-time command summary</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={risk.variant} className="text-[10px]">
                <Shield className="mr-1 h-3 w-3" />
                {risk.label}
              </Badge>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-elevated/50 p-2.5 text-center"
                >
                  <Icon className={cn("mx-auto mb-1 h-4 w-4", item.color)} />
                  <p className="text-xs font-semibold tabular-nums">{item.value}</p>
                  <p className="text-[9px] text-muted-foreground/60 truncate">{item.label}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-elevated/30 px-3 py-2">
              <Camera className="h-3.5 w-3.5 text-muted-foreground/60" />
              <div className="text-[10px]">
                <span className="text-muted-foreground/60">Camera</span>
                <span className={cn("ml-1.5 font-medium", health?.status === "healthy" ? "text-success" : "text-danger")}>
                  {health?.status === "healthy" ? "Online" : "Check"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-elevated/30 px-3 py-2">
              <Database className="h-3.5 w-3.5 text-muted-foreground/60" />
              <div className="text-[10px]">
                <span className="text-muted-foreground/60">Database</span>
                <span className={cn("ml-1.5 font-medium", health?.database === "connected" ? "text-success" : "text-danger")}>
                  {health?.database === "connected" ? "Online" : "Offline"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-elevated/30 px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground/60" />
              <div className="text-[10px]">
                <span className="text-muted-foreground/60">Denied</span>
                <span className="ml-1.5 font-medium tabular-nums">{deniedCount}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-elevated/30 px-3 py-2">
              <Eye className="h-3.5 w-3.5 text-muted-foreground/60" />
              <div className="text-[10px]">
                <span className="text-muted-foreground/60">Reviews</span>
                <span className="ml-1.5 font-medium tabular-nums">{reviewCount}</span>
              </div>
            </div>
          </div>

          {isError ? (
            <div className="rounded-lg border border-border/50 bg-elevated/30 p-3 text-center">
              <p className="text-xs text-muted-foreground">Some data sources unavailable</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 bg-elevated/30 p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground/70">Recommendations</span>
              </div>
              <ul className="space-y-1">
                {recs.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground/70">
                    <span className={cn("mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full", r.includes("nominal") ? "bg-success" : "bg-warning")} />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export { LiveOperationsBriefing };
