import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ChevronDown } from "lucide-react";
import type { ApiEventSummary } from "../api/types";

type EventSummary = ApiEventSummary;

interface EventsFeedProps {
  events: EventSummary[];
  isLoading: boolean;
  isError: boolean;
}

const SEVERITY_DOT: Record<EventSummary["severity"], string> = {
  info: "bg-blue-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  critical: "bg-red-700",
};

const SEVERITY_BADGE: Record<EventSummary["severity"], "info" | "warning" | "danger" | "danger"> = {
  info: "info",
  warning: "warning",
  error: "danger",
  critical: "danger",
};

function EventSkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <div className="mt-1 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function EventsFeedSkeleton() {
  return (
    <Card className="p-3">
      <div className="space-y-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <EventSkeleton key={i} />
        ))}
      </div>
    </Card>
  );
}

function EventsFeedError() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load events.</p>
      </div>
    </Card>
  );
}

function EventsFeedEmpty() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No events.</p>
      </div>
    </Card>
  );
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

export function EventsFeed({ events, isLoading, isError }: EventsFeedProps) {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLDivElement | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const prevLenRef = useRef(events.length);

  useEffect(() => {
    if (events.length > prevLenRef.current && autoScroll) {
      listRef.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
    if (events.length > prevLenRef.current && !autoScroll) {
      setNewCount((c) => c + (events.length - prevLenRef.current));
    }
    prevLenRef.current = events.length;
  }, [events.length, autoScroll, reduced]);

  const handleScrollTop = () => {
    listRef.current?.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    setAutoScroll(true);
    setNewCount(0);
  };

  if (isLoading) return <EventsFeedSkeleton />;
  if (isError) return <EventsFeedError />;
  if (!events || events.length === 0) return <EventsFeedEmpty />;

  return (
    <Card className="overflow-hidden">
      <div className="relative max-h-[400px] overflow-y-auto" ref={listRef}>
        {newCount > 0 && (
          <button
            onClick={handleScrollTop}
            className="sticky top-0 z-10 flex w-full items-center justify-center gap-1.5 border-b border-border bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
          >
            <ChevronDown className="h-3 w-3 rotate-180" />
            {newCount} new event{newCount !== 1 ? "s" : ""}
          </button>
        )}
        <div className="divide-y divide-border/50">
          {events.map((event) => (
            <div
              key={event.id}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-muted/30",
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                  SEVERITY_DOT[event.severity],
                )}
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {formatTimestamp(event.timestamp)}
                  </span>
                  <Badge variant={SEVERITY_BADGE[event.severity]} size="sm">
                    {event.type}
                  </Badge>
                </div>
                <p className="text-xs text-foreground">{event.message}</p>
                <p className="text-[11px] text-muted-foreground">{event.source}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
