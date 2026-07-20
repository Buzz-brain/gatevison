import { useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ZoomIn, ZoomOut, ChevronRight, Search, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { TimelineEvent, PipelineStage } from "../types";

interface InvestigationTimelineProps {
  events: TimelineEvent[];
  activeStage?: string;
  onJumpToStage?: (stage: PipelineStage) => void;
  onJumpToEvent?: (index: number) => void;
  currentEventIndex?: number;
}

function InvestigationTimeline({
  events,
  activeStage,
  onJumpToStage,
  onJumpToEvent,
  currentEventIndex,
}: InvestigationTimelineProps) {
  const prefersReduced = useReducedMotion();
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentEventIndex]);

  const decisionEvent = events.findLast((e) =>
    e.label.toLowerCase().includes("access") || e.label.toLowerCase().includes("gate")
  );
  const totalDuration = useMemo(() => {
    if (events.length < 2) return 0;
    const first = new Date(`1970-01-01T${events[0]?.time ?? "00:00:00"}Z`);
    const last = new Date(`1970-01-01T${events[events.length - 1]?.time ?? "00:00:00"}Z`);
    return last.getTime() - first.getTime();
  }, [events]);

  return (
    <Card className="p-4 overflow-hidden">
      <div className="mb-3 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">AI Investigation Timeline</h3>
        {totalDuration > 0 && (
          <span className="ml-auto text-[10px] font-mono text-muted-foreground/50">
            {(totalDuration / 1000).toFixed(3)}s total
          </span>
        )}
      </div>

      <div
        ref={listRef}
        className="space-y-0 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin"
      >
        {events.map((event, i) => {
          const isActive = i === currentEventIndex || event.stage === activeStage;
          const isDecision = event.label.toLowerCase().includes("access") ||
                             event.label.toLowerCase().includes("gate");
          const isLast = i === events.length - 1;

          return (
            <motion.button
              key={`${event.time}-${i}`}
              ref={isActive ? activeRef : undefined}
              initial={prefersReduced ? undefined : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.025 }}
              onClick={() => {
                onJumpToEvent?.(i);
                if (event.stage !== "idle") onJumpToStage?.(event.stage);
              }}
              className={cn(
                "relative flex w-full items-start gap-3 py-2.5 px-2 text-left rounded-lg transition-all",
                isActive
                  ? "bg-primary/10 ring-1 ring-primary/30"
                  : "hover:bg-elevated/50",
              )}
            >
              {!isLast && (
                <div className={cn(
                  "absolute left-[13px] top-6 h-full w-px",
                  isActive ? "bg-primary/40" : "bg-border/60",
                )} />
              )}

              <div className={cn(
                "relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-2",
                isDecision
                  ? "bg-success ring-success/30"
                  : isActive
                    ? "bg-primary ring-primary/30"
                    : event.status === "failed"
                      ? "bg-danger ring-danger/30"
                      : event.status === "manual_review"
                        ? "bg-warning ring-warning/30"
                        : "bg-border ring-transparent",
              )} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "text-xs font-mono",
                    isActive ? "text-foreground" : "text-muted-foreground/70",
                  )}>
                    {event.label}
                  </span>
                  <span className={cn(
                    "font-mono text-[10px] shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground/40",
                  )}>
                    {event.time}
                  </span>
                </div>
                {event.detail && (
                  <p className="mt-0.5 text-[10px] font-mono text-primary/60 truncate">
                    {event.detail}
                  </p>
                )}
              </div>

              {isActive && (
                <div className="shrink-0 flex items-center">
                  <ChevronRight className="h-3 w-3 text-primary" />
                </div>
              )}
            </motion.button>
          );
        })}

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-muted-foreground/20 mb-2" />
            <p className="text-xs text-muted-foreground/50">No timeline events recorded</p>
            <p className="text-[10px] text-muted-foreground/30 mt-1">
              Run a recognition pipeline to populate the investigation timeline
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

export { InvestigationTimeline };
