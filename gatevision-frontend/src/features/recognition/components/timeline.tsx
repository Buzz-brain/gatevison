import { motion } from "framer-motion";
import { Clock, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { TimelineEvent } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface TimelineProps {
  events: TimelineEvent[];
  activeStage?: string;
}

const statusColor: Record<string, string> = {
  completed: "bg-success",
  processing: "bg-primary animate-pulse",
  failed: "bg-danger",
  manual_review: "bg-warning",
  inactive: "bg-border",
};

function Timeline({ events, activeStage }: TimelineProps) {
  const prefersReduced = useReducedMotion();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Recognition Timeline</h3>
      </div>

      <div className="space-y-0">
        {events.map((event, i) => {
          const isActive = event.stage === activeStage;
          return (
            <motion.div
              key={i}
              initial={prefersReduced ? undefined : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative flex items-start gap-3 pb-3 last:pb-0"
            >
              {i < events.length - 1 && (
                <div className="absolute left-[5px] top-4 h-full w-px bg-border" />
              )}
              <div className={cn(
                "relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                statusColor[event.status] || "bg-border",
                isActive && "ring-2 ring-primary/30",
              )} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "text-xs",
                    isActive ? "font-medium text-foreground" : "text-muted-foreground/80",
                  )}>
                    {event.label}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/50">{event.time}</span>
                </div>
                {event.detail && (
                  <p className="text-[10px] font-mono text-primary/70">{event.detail}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

export { Timeline };
