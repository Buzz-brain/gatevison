import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpDown, ArrowUp, ArrowDown, Wifi, WifiOff, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGateStatistics } from "../hooks/use-dashboard-api";
import { mapGateInfo } from "../api/mapper";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const barrierIcons = {
  up: ArrowUp,
  down: ArrowDown,
  moving: ArrowUpDown,
};

function GateStatusPanel() {
  const { data: gateStats, isLoading, isError, refetch } = useGateStatistics();
  const prefersReduced = useReducedMotion();

  const gates = useMemo(
    () => (gateStats?.gates ?? []).map(mapGateInfo),
    [gateStats],
  );

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="h-4 w-24 bg-muted rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-5">
        <h3 className="mb-4 text-sm font-medium">Gate Status</h3>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <p className="text-xs text-muted-foreground">Failed to load gate status</p>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-sm font-medium">Gate Status</h3>
      <div className="space-y-2">
        {gates.map((gate, i) => {
          const BarrierIcon = barrierIcons[gate.barrier] || ArrowUpDown;
          const isOpen = gate.barrier === "up";
          return (
            <motion.div
              key={gate.id}
              initial={prefersReduced ? undefined : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                gate.connection === "online" ? "border-border" : "border-danger/30 bg-danger/5",
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                isOpen ? "bg-success/10 text-success" : "bg-elevated text-muted-foreground",
              )}>
                <ArrowUpDown className="h-4 w-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{gate.name}</span>
                  {gate.connection === "offline" && (
                    <Badge variant="danger" size="sm">Offline</Badge>
                  )}
                  {gate.connection === "degraded" && (
                    <Badge variant="warning" size="sm">Degraded</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground/70">
                  <span className="flex items-center gap-1">
                    <BarrierIcon className="h-3 w-3" />
                    {gate.barrier === "up" ? "Open" : gate.barrier === "down" ? "Closed" : "Moving"}
                  </span>
                  <span>Sensor: {gate.sensorState}</span>
                  {gate.currentVehicle && (
                    <span>{gate.currentVehicle}</span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="flex items-center gap-1 justify-end">
                  {gate.connection === "online" ? (
                    <Wifi className="h-3 w-3 text-success" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-danger" />
                  )}
                  <span className="text-[10px] text-muted-foreground/60">{gate.operator}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

export { GateStatusPanel };
