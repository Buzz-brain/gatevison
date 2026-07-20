import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle, AlertCircle, AlertOctagon, Info, X, ChevronRight, Check, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Incident } from "../types";

const severityIcons = {
  critical: AlertOctagon,
  high: AlertCircle,
  medium: AlertTriangle,
  low: Info,
};

const severityColors = {
  critical: "border-l-danger bg-danger/5",
  high: "border-l-warning bg-warning/5",
  medium: "border-l-primary/50 bg-primary/[0.03]",
  low: "border-l-border bg-surface",
};

const severityBadge = {
  critical: "danger",
  high: "warning",
  medium: "info",
  low: "neutral",
} as const;

interface IncidentPanelProps {
  incidents: Incident[];
  onDismiss: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

function IncidentPanel({ incidents, onDismiss, isLoading, isError, onRetry }: IncidentPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const criticalCount = incidents.filter(i => i.severity === "critical" || i.severity === "high").length;

  return (
    <Card className="flex flex-col h-full">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between border-b border-border px-5 py-3 w-full text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Active Incidents</h3>
          {criticalCount > 0 && (
            <Badge variant="danger" size="sm">{criticalCount} critical</Badge>
          )}
          {incidents.length > 0 && (
            <span className="text-[10px] text-muted-foreground/60">{incidents.length} total</span>
          )}
        </div>
        <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", collapsed && "rotate-90")} />
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-y-auto flex-1"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground/40" />
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-xs text-muted-foreground">Failed to load incidents</p>
                {onRetry && (
                  <button onClick={onRetry} className="text-xs text-primary hover:text-primary/80 transition-colors">
                    Retry
                  </button>
                )}
              </div>
            ) : incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                  <Check className="h-4 w-4 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">No active incidents</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {incidents.map((incident) => {
                  const Icon = severityIcons[incident.severity];
                  return (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={cn(
                        "group relative rounded-lg border-l-2 px-3 py-2.5",
                        severityColors[incident.severity],
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <Icon className={cn(
                          "mt-0.5 h-3.5 w-3.5 shrink-0",
                          incident.severity === "critical" ? "text-danger" :
                          incident.severity === "high" ? "text-warning" :
                          incident.severity === "medium" ? "text-primary" : "text-muted-foreground",
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-foreground">{incident.title}</span>
                            <Badge variant={severityBadge[incident.severity]} size="sm">
                              {incident.severity}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground/70 line-clamp-2">
                            {incident.description}
                          </p>
                          {incident.actionLabel && (
                            <button className="mt-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors">
                              {incident.actionLabel} →
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => onDismiss(incident.id)}
                          className="shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                          aria-label="Dismiss incident"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export { IncidentPanel };
