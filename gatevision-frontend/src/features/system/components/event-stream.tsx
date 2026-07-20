import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Play, Pause, ChevronDown, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { EventEntry } from "../types";

interface EventStreamProps {
  events: EventEntry[];
}

const STATUS_DOT: Record<string, string> = {
  success: "bg-success",
  warning: "bg-warning",
  critical: "bg-danger",
  info: "bg-primary",
};

const STATUS_BADGE: Record<string, "success" | "warning" | "danger" | "info"> = {
  success: "success",
  warning: "warning",
  critical: "danger",
  info: "info",
};

function formatTime(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return ts;
  }
}

export function EventStream({ events }: EventStreamProps) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prevLenRef = useRef(events.length);

  useEffect(() => {
    if (events.length > prevLenRef.current && paused) {
      setNewCount((c) => c + (events.length - prevLenRef.current));
    }
    prevLenRef.current = events.length;
  }, [events.length, paused]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
    }
  }, [reduced]);

  useEffect(() => {
    if (!paused) {
      setNewCount(0);
      const raf = requestAnimationFrame(() => scrollToBottom());
      return () => cancelAnimationFrame(raf);
    }
  }, [events.length, paused, scrollToBottom]);

  const handleResume = useCallback(() => {
    setPaused(false);
    setNewCount(0);
    requestAnimationFrame(() => scrollToBottom());
  }, [scrollToBottom]);

  return (
    <Card className="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Event Stream</h3>
          <Badge variant="neutral" size="sm">{events.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {paused && newCount > 0 && (
            <motion.button
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-xs bg-primary/15 text-primary rounded-full px-2.5 py-1 font-medium hover:bg-primary/25 transition-colors"
              onClick={handleResume}
            >
              <ChevronDown className="h-3 w-3" />
              {newCount} new
            </motion.button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              if (paused) {
                handleResume();
              } else {
                setPaused(true);
              }
            }}
            aria-label={paused ? "Resume event stream" : "Pause event stream"}
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 min-h-0 max-h-[480px]"
      >
        <AnimatePresence initial={false}>
          {events.map((evt, i) => (
            <motion.div
              key={evt.id}
              initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: reduced ? 0 : Math.min(i * 0.02, 0.3) }}
              className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
            >
              <div className="flex items-center gap-2.5 shrink-0 pt-1">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full ring-2 ring-background",
                      STATUS_DOT[evt.status] ?? "bg-muted-foreground"
                    )}
                  />
                  {i < events.length - 1 && (
                    <div className="w-px h-4 bg-border" />
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium truncate">{evt.title}</span>
                  <Badge variant={STATUS_BADGE[evt.status] ?? "neutral"} size="sm">
                    {evt.module}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono">{formatTime(evt.timestamp)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No events yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}
