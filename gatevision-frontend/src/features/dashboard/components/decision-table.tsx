import { useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDecisionHistory } from "../hooks/use-dashboard-api";
import { mapDecisionHistoryToRecent } from "../api/mapper";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const decisionConfig: Record<string, { badge: "success" | "danger" | "warning"; label: string }> = {
  granted: { badge: "success", label: "Granted" },
  denied: { badge: "danger", label: "Denied" },
  manual_review: { badge: "warning", label: "Review" },
};

function RecentDecisionsTable() {
  const { data, isLoading, isError, refetch } = useDecisionHistory();
  const prefersReduced = useReducedMotion();

  const decisions = useMemo(
    () => (data?.items ?? []).map(mapDecisionHistoryToRecent),
    [data],
  );

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="h-4 w-24 bg-muted rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Recent Decisions</h3>
        </div>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-xs text-muted-foreground">Failed to load decisions</p>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </Card>
    );
  }

  if (decisions.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Recent Decisions</h3>
        </div>
        <p className="text-xs text-muted-foreground/50 text-center py-6">No decisions recorded yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Recent Decisions</h3>
        <Button variant="ghost" size="xs">View All</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground/60 border-b border-border">
              <th className="text-left font-medium pb-2 pr-4">Plate</th>
              <th className="text-left font-medium pb-2 pr-4">Driver</th>
              <th className="text-left font-medium pb-2 pr-4">Vehicle</th>
              <th className="text-left font-medium pb-2 pr-4">Decision</th>
              <th className="text-right font-medium pb-2 pr-4">Confidence</th>
              <th className="text-right font-medium pb-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((d, i) => {
              const config = (decisionConfig[d.decision] ?? decisionConfig.granted)!;
              return (
                <motion.tr
                  key={d.id}
                  initial={prefersReduced ? undefined : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 last:border-0 hover:bg-elevated/50 transition-colors"
                >
                  <td className="py-2.5 pr-4 font-mono">{d.plate}</td>
                  <td className="py-2.5 pr-4">{d.driver}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground/70">{d.vehicle}</td>
                  <td className="py-2.5 pr-4">
                    <Badge variant={config.badge} size="sm">{config.label}</Badge>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className={cn(
                      "font-mono",
                      d.confidence > 95 ? "text-success" : d.confidence > 70 ? "text-warning" : "text-danger",
                    )}>
                      {d.confidence.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground/60 font-mono">
                    {d.processingTime}ms
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export { RecentDecisionsTable };
