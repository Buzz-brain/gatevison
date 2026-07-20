import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fadeIn } from "@/lib/animations";
import { QUERY_KEYS } from "@/lib/api/query-client";
import { getHealthApi } from "@/services/api/health.api";
import { Server, Database, Clock, Activity } from "lucide-react";

function BackendStatus() {
  const reduced = useReducedMotion();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.HEALTH,
    queryFn: getHealthApi,
    refetchInterval: 30_000,
    retry: 2,
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-24 rounded bg-surface" />
          <div className="h-3 w-32 rounded bg-surface" />
        </div>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <motion.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="cursor-pointer p-4 transition-colors hover:bg-elevated" onClick={() => refetch()}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/10">
              <Server className="h-4 w-4 text-danger" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Backend Disconnected</p>
              <p className="text-xs text-muted-foreground">Click to retry</p>
            </div>
            <Badge variant="danger">Offline</Badge>
          </div>
        </Card>
      </motion.div>
    );
  }

  const statusColor = data.status === "healthy" ? "success" : data.status === "degraded" ? "warning" : "danger";

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <Server className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium">Backend Status</p>
              <p className="text-xs text-muted-foreground">v{data.version}</p>
            </div>
          </div>
          <Badge variant={statusColor as "success" | "warning" | "danger"}>
            {data.status}
          </Badge>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database className="h-3 w-3" />
            <span>DB: {data.database === "connected" ? "Online" : "Offline"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>Uptime: {Math.floor(data.uptime / 3600)}h</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{new Date(data.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export { BackendStatus };
