import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Car, LogIn, LogOut, Activity, MapPin, Wifi, WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useGateStatistics, useGateActive } from "../hooks/use-dashboard-api";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function CommandMap() {
  const { data: gateStats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useGateStatistics();
  const { data: gateActive, isLoading: activeLoading, isError: activeError, refetch: refetchActive } = useGateActive();
  const prefersReduced = useReducedMotion();

  const isLoading = statsLoading || activeLoading;
  const isError = statsError || activeError;

  const gates = useMemo(() => Array.isArray(gateStats?.gates) ? gateStats.gates : [], [gateStats]);
  const vehiclesInside = gateActive?.total_vehicles_inside ?? 0;
  const totalEntries = useMemo(() => gates.reduce((s, g) => s + (g.entries_today ?? 0), 0), [gates]);
  const totalExits = useMemo(() => gates.reduce((s, g) => s + (g.exits_today ?? 0), 0), [gates]);
  const busyGate = useMemo(() => {
    if (gates.length === 0) return "N/A";
    return [...gates].sort((a, b) => ((b.entries_today ?? 0) + (b.exits_today ?? 0)) - ((a.entries_today ?? 0) + (a.exits_today ?? 0)))[0]?.name ?? "N/A";
  }, [gates]);

  const onlineGates = useMemo(() => gates.filter((g) => g.connection === "online").length, [gates]);

  if (isLoading) {
    return (
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium">Site Map</h3>
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-medium">Site Map</h3>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-xs text-muted-foreground">Failed to load gate data</p>
          <button onClick={() => { refetchStats(); refetchActive(); }} className="text-xs text-primary hover:text-primary/80 transition-colors">
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-medium">Site Map</h3>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-elevated border border-border p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Car className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground/60">Vehicles Inside</span>
            </div>
            <motion.span
              key={vehiclesInside}
              initial={prefersReduced ? undefined : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-semibold tabular-nums"
            >
              {vehiclesInside}
            </motion.span>
          </div>
          <div className="rounded-lg bg-elevated border border-border p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="h-3 w-3 text-warning" />
              <span className="text-[10px] text-muted-foreground/60">Busy Gate</span>
            </div>
            <span className="text-sm font-semibold truncate block">{busyGate}</span>
          </div>
          <div className="rounded-lg bg-elevated border border-border p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="h-3 w-3 text-success" />
              <span className="text-[10px] text-muted-foreground/60">Utilization</span>
            </div>
            <span className="text-lg font-semibold tabular-nums">
              {gates.length > 0 ? `${Math.round((onlineGates / gates.length) * 100)}%` : "N/A"}
            </span>
          </div>
          <div className="rounded-lg bg-elevated border border-border p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Wifi className="h-3 w-3 text-info" />
              <span className="text-[10px] text-muted-foreground/60">Active Sessions</span>
            </div>
            <span className="text-lg font-semibold tabular-nums">{onlineGates}/{gates.length}</span>
          </div>
        </div>
        <div className="rounded-lg bg-elevated border border-border p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <LogIn className="h-3 w-3 text-success" />
              <span className="text-[10px] text-muted-foreground/60">Entries Today</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-success">{totalEntries.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1.5">
              <LogOut className="h-3 w-3 text-primary" />
              <span className="text-[10px] text-muted-foreground/60">Exits Today</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-primary">{totalExits.toLocaleString()}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${totalEntries + totalExits > 0 ? (totalEntries / (totalEntries + totalExits)) * 100 : 50}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-0.5 text-[9px] text-muted-foreground/40">
            <span>Entries {totalEntries}</span>
            <span>Exits {totalExits}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export { CommandMap };
