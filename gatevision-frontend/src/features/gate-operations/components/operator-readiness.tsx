import { Camera, Cpu, Database, ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSystemHealth, useCameraStatus } from "../hooks/use-gate-operations-api";
import type { GateInfo } from "../types";

interface OperatorReadinessProps {
  gates: GateInfo[];
}

type Readiness = "online" | "degraded" | "offline" | "idle" | "checking";

function statusBadge(status: Readiness) {
  if (status === "online") return <Badge variant="success">ONLINE</Badge>;
  if (status === "idle") return <Badge variant="neutral">IDLE</Badge>;
  if (status === "degraded") return <Badge variant="warning">DEGRADED</Badge>;
  if (status === "checking") return <Badge variant="neutral">CHECKING</Badge>;
  return <Badge variant="danger">OFFLINE</Badge>;
}

function isHealthy(value: string | undefined | null): boolean {
  return value === "healthy" || value === "online";
}

function OperatorReadiness({ gates }: OperatorReadinessProps) {
  const healthQuery = useSystemHealth();
  const cameraQuery = useCameraStatus();

  const health = healthQuery.data;
  const loading = healthQuery.isLoading || cameraQuery.isLoading;

  const cam = cameraQuery.data;
  const camerasReady: Readiness =
    loading ? "checking"
      : cam?.is_running ? "online"
      : cam ? "idle"
      : "degraded";
  const modelsReady: Readiness = loading ? "checking" : isHealthy(health?.ai_services) ? "online" : "degraded";
  const databaseReady: Readiness = loading ? "checking" : isHealthy(health?.database) ? "online" : "offline";
  const gatesReady: Readiness =
    gates.length === 0 ? "checking" : gates.some((g) => g.status === "open" && g.health?.network === "healthy") ? "online" : "degraded";

  const items = [
    { key: "camera", icon: Camera, label: "Camera", detail: camerasReady === "online" ? "LPR camera streaming" : camerasReady === "idle" ? "Camera idle - not started" : "Camera feed check", state: camerasReady },
    { key: "models", icon: Cpu, label: "Models", detail: modelsReady === "online" ? "YOLO + EasyOCR ready" : "Model health check", state: modelsReady },
    { key: "database", icon: Database, label: "Database", detail: databaseReady === "online" ? "MongoDB connected" : "Database connection check", state: databaseReady },
    { key: "gate", icon: ShieldCheck, label: "Gate", detail: gatesReady === "online" ? "Barriers armed" : "Gate readiness check", state: gatesReady },
  ];

  const overallOnline = items.every((i) => i.state === "online" || i.state === "idle");

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-end">
        {loading ? (
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Checking
          </span>
        ) : overallOnline ? (
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> ALL SYSTEMS OPERATIONAL
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-warning">
            <AlertTriangle className="h-3 w-3" /> ATTENTION REQUIRED
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className="flex items-center gap-3 rounded-lg border border-border bg-elevated/60 px-3 py-2.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium leading-none">{item.label}</p>
                </div>
                <p className="mt-1 truncate text-[10px] text-muted-foreground">{item.detail}</p>
              </div>
              <div className="ml-auto">{statusBadge(item.state)}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export { OperatorReadiness };
