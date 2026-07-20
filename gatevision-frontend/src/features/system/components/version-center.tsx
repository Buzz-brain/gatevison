import { motion } from "framer-motion";
import { GitCommit, Calendar, Server } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { VersionEntry, HealthStatus } from "../types";

interface VersionCenterProps {
  versions: VersionEntry[];
}

const STATUS_TO_PILL: Record<string, "healthy" | "degraded" | "unhealthy" | "inactive"> = {
  healthy: "healthy",
  degraded: "degraded",
  unhealthy: "unhealthy",
  down: "inactive",
};

function VersionCard({
  entry,
  index,
  reduced,
}: {
  entry: VersionEntry;
  index: number;
  reduced: boolean;
}) {
  const pillStatus = entry.status ? STATUS_TO_PILL[entry.status] ?? "inactive" : "inactive";
  const statusColor =
    entry.status === "healthy"
      ? "#22c55e"
      : entry.status === "degraded"
        ? "#f59e0b"
        : entry.status === "unhealthy"
          ? "#ef4444"
          : "#6b7280";

  return (
    <motion.div
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduced ? 0 : index * 0.06 }}
    >
      <Card className="p-5 h-full hover:border-white/10 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-lg p-2"
              style={{ backgroundColor: `${statusColor}15` }}
            >
              <Server className="h-4 w-4" style={{ color: statusColor }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold">{entry.component}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">Component</p>
            </div>
          </div>
          {entry.status && (
            <StatusPill
              status={pillStatus}
              label={entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
            />
          )}
        </div>

        <div className="mb-4">
          <span className="font-mono text-2xl font-bold tracking-tight">
            v{entry.version}
          </span>
        </div>

        {entry.updated && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Updated {entry.updated}</span>
          </div>
        )}

        <div
          className="mt-4 h-1 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: `${statusColor}15` }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: statusColor }}
            initial={reduced ? { width: "100%" } : { width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.8, delay: reduced ? 0 : index * 0.06 + 0.2, ease: "easeOut" }}
          />
        </div>
      </Card>
    </motion.div>
  );
}

export function VersionCenter({ versions }: VersionCenterProps) {
  const reduced = useReducedMotion();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GitCommit className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Version Center</h3>
        <span className="text-xs text-muted-foreground bg-elevated rounded-full px-2 py-0.5">
          {versions.length} components
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {versions.map((entry, i) => (
          <VersionCard key={entry.component} entry={entry} index={i} reduced={reduced} />
        ))}
      </div>
    </div>
  );
}
