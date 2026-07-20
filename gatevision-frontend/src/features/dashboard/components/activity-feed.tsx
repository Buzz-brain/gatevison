import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn, LogOut, XCircle, AlertTriangle, Info, RefreshCw, UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useDashboardEvents } from "../hooks/use-dashboard-api";
import type { ActivityEvent } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const eventIcons: Record<string, typeof LogIn> = {
  entry: LogIn,
  exit: LogOut,
  denied: XCircle,
  alert: AlertTriangle,
  system: RefreshCw,
  review: UserCheck,
  warning: AlertTriangle,
  manual_review: UserCheck,
};

const eventColors: Record<string, string> = {
  entry: "text-success",
  exit: "text-primary",
  denied: "text-danger",
  alert: "text-warning",
  system: "text-info",
  review: "text-warning",
  warning: "text-warning",
  manual_review: "text-warning",
};

const eventBgColors: Record<string, string> = {
  entry: "bg-success/5 border-l-success",
  exit: "bg-primary/5 border-l-primary",
  denied: "bg-danger/5 border-l-danger",
  alert: "bg-warning/5 border-l-warning",
  system: "bg-info/5 border-l-info",
  review: "bg-warning/5 border-l-warning",
  warning: "bg-warning/5 border-l-warning",
  manual_review: "bg-warning/5 border-l-warning",
};

function formatEventTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return "Just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins === 1) return "1m ago";
  return `${mins}m ago`;
}

function ActivityFeed() {
  const { data: events = [], isLoading, isError, refetch } = useDashboardEvents();
  const prefersReduced = useReducedMotion();

  const sorted = useMemo(
    () => [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50),
    [events],
  );

  if (isLoading) {
    return (
      <Card className="flex flex-col h-full">
        <div className="border-b border-border px-5 py-3">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1 p-2 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="flex flex-col h-full">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-sm font-medium">Live Activity</h3>
        </div>
        <div className="flex flex-col items-center gap-2 py-8 text-center flex-1">
          <p className="text-xs text-muted-foreground">Failed to load events</p>
          <button onClick={() => refetch()} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h3 className="text-sm font-medium">Live Activity</h3>
        <span className="text-[10px] text-muted-foreground/60">{sorted.length} events</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <AnimatePresence initial={false}>
          {sorted.slice(0, 20).map((event) => {
            const Icon = eventIcons[event.type] || Info;
            return (
              <motion.div
                key={event.id}
                initial={prefersReduced ? undefined : { opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-start gap-3 rounded-lg border-l-2 px-3 py-2",
                  eventBgColors[event.type] || "bg-surface border-l-border",
                )}
              >
                <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", eventColors[event.type] || "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground/90 truncate">{event.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground/50">
                      {formatEventTime(event.timestamp)}
                    </span>
                    {event.confidence !== undefined && (
                      <span className={cn(
                        "text-[10px] font-mono",
                        event.confidence > 90 ? "text-success" : event.confidence > 60 ? "text-warning" : "text-danger",
                      )}>
                        {event.confidence.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
}

export { ActivityFeed };
