import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldX,
  Edit,
  RotateCcw,
  ArrowUpDown,
  Car,
  VideoOff,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { SecurityEvent, Severity } from "../types";
import { SEVERITY_CONFIG } from "../utils";
import { timeAgo } from "../utils";

const EVENT_ICON_MAP: Record<string, typeof ShieldX> = {
  failed_login: ShieldX,
  permission_change: Edit,
  model_reload: RotateCcw,
  decision_override: ArrowUpDown,
  unknown_vehicle: Car,
  camera_offline: VideoOff,
  suspicious_activity: AlertTriangle,
};

const FILTER_TABS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
  { value: "resolved", label: "Resolved" },
];

const SEVERITY_BORDER: Record<Severity, string> = {
  critical: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-blue-500",
  resolved: "border-l-green-500",
};

const SEVERITY_BADGE: Record<Severity, "danger" | "warning" | "info" | "success"> = {
  critical: "danger",
  warning: "warning",
  info: "info",
  resolved: "success",
};

interface SecurityEventsProps {
  events: SecurityEvent[];
  filter: string;
  onFilterChange: (v: string) => void;
  onAcknowledge: (id: string) => void;
}

export function SecurityEvents({
  events,
  filter,
  onFilterChange,
  onAcknowledge,
}: SecurityEventsProps) {
  const reduced = useReducedMotion();
  const [assigning, setAssigning] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? events
      : events.filter((e) => e.severity === filter);

  function handleAssign(id: string) {
    setAssigning(id);
    setTimeout(() => setAssigning(null), 1000);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.value === "all"
              ? events.length
              : events.filter((e) => e.severity === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => onFilterChange(tab.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                filter === tab.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-elevated"
              )}
            >
              {tab.label}
              <Badge variant={filter === tab.value ? "default" : "neutral"} size="sm">
                {count}
              </Badge>
            </button>
          );
        })}
      </div>

      <div className="grid gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((event) => {
            const Icon = EVENT_ICON_MAP[event.type] ?? AlertTriangle;
            const cfg = SEVERITY_CONFIG[event.severity];
            return (
              <motion.div
                key={event.id}
                layout={!reduced}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: reduced ? 0 : 0.2 }}
              >
                <Card
                  className={cn(
                    "border-l-4 transition-shadow",
                    SEVERITY_BORDER[event.severity],
                    !event.acknowledged && "ring-1 ring-primary/20"
                  )}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        event.severity === "critical"
                          ? "bg-red-500/10 text-red-500"
                          : event.severity === "warning"
                            ? "bg-amber-500/10 text-amber-500"
                            : event.severity === "info"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-green-500/10 text-green-500"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {event.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        </div>
                        {!event.acknowledged && (
                          <span className="relative flex h-2.5 w-2.5 shrink-0 mt-1">
                            <span
                              className={cn(
                                "absolute inline-flex h-full w-full rounded-full opacity-75",
                                event.severity === "critical"
                                  ? "animate-ping bg-red-500"
                                  : "animate-pulse bg-primary"
                              )}
                            />
                            <span
                              className={cn(
                                "relative inline-flex h-2.5 w-2.5 rounded-full",
                                event.severity === "critical"
                                  ? "bg-red-500"
                                  : "bg-primary"
                              )}
                            />
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={SEVERITY_BADGE[event.severity]} size="sm">
                          {cfg.label}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {event.module}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {timeAgo(event.timestamp)}
                        </span>
                        {event.acknowledged && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-500">
                            <CheckCircle2 className="h-3 w-3" />
                            Acknowledged
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1.5">
                      {!event.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAcknowledge(event.id)}
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAssign(event.id)}
                        disabled={assigning === event.id}
                      >
                        <UserPlus className="mr-1 h-3.5 w-3.5" />
                        {assigning === event.id ? "Assigned" : "Assign"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No events match this filter.
          </div>
        )}
      </div>
    </div>
  );
}
