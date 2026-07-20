import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, Clock,
  Car, LogIn, LogOut, AlertTriangle, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTransactions } from "../hooks/use-gate-operations-api";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { TrafficPlaybackEvent, PlaybackState } from "../types";

const SPEEDS = [0.5, 1, 2];

function TrafficPlayback() {
  const { data: txData, isLoading, isError, refetch } = useTransactions();
  const prefersReduced = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allEvents = useMemo<TrafficPlaybackEvent[]>(() => {
    if (!txData?.items) return [];
    return txData.items
      .map((t) => ({
        id: t.id,
        plate: t.plate,
        type: t.type as TrafficPlaybackEvent["type"],
        decision: t.decision as TrafficPlaybackEvent["decision"],
        gate: t.gateName,
        timestamp: t.timestamp,
        confidence: t.confidence,
        driver: t.driver,
        vehicle: t.vehicle,
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [txData]);

  const [pb, setPb] = useState<PlaybackState>({
    events: [], currentIndex: -1, playing: false, speed: 1,
    startTime: "", endTime: "",
  });

  useEffect(() => {
    if (allEvents.length > 0 && pb.events.length === 0) {
      setPb({
        events: allEvents,
        currentIndex: -1,
        playing: false,
        speed: 1,
        startTime: allEvents[0]?.timestamp ?? "",
        endTime: allEvents[allEvents.length - 1]?.timestamp ?? "",
      });
    }
  }, [allEvents, pb.events.length]);

  const visibleEvents = useMemo(
    () => pb.events.slice(0, pb.currentIndex + 1),
    [pb.events, pb.currentIndex],
  );

  const stats = useMemo(() => {
    const entries = visibleEvents.filter((e) => e.type === "entry" && e.decision === "granted").length;
    const exits = visibleEvents.filter((e) => e.type === "exit" && e.decision === "granted").length;
    const denied = visibleEvents.filter((e) => e.decision === "denied").length;
    const inside = entries - exits;
    const avgDuration = visibleEvents.length > 0
      ? visibleEvents.reduce((s, _, i, arr) => {
          if (i === 0) return 0;
          const curr = new Date(arr[i]!.timestamp).getTime();
          const prev = new Date(arr[i - 1]!.timestamp).getTime();
          return s + (curr - prev);
        }, 0) / Math.max(1, visibleEvents.length - 1)
      : 0;
    return { entries, exits, denied, inside: Math.max(0, inside), avgDuration };
  }, [visibleEvents]);

  const progress = pb.events.length > 1
    ? ((pb.currentIndex + 1) / pb.events.length) * 100
    : 0;

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const tick = useCallback(() => {
    setPb((prev) => {
      if (prev.currentIndex >= prev.events.length - 1) {
        return { ...prev, playing: false };
      }
      return { ...prev, currentIndex: prev.currentIndex + 1 };
    });
  }, []);

  useEffect(() => {
    if (pb.playing && pb.currentIndex < pb.events.length - 1) {
      const baseInterval = 400;
      const delay = prefersReduced ? 0 : baseInterval / pb.speed;
      timerRef.current = setTimeout(tick, delay);
    } else if (pb.currentIndex >= pb.events.length - 1) {
      setPb((prev) => ({ ...prev, playing: false }));
    }
    return clearTimer;
  }, [pb.playing, pb.currentIndex, pb.events.length, pb.speed, tick, clearTimer, prefersReduced]);

  const play = useCallback(() => {
    if (pb.currentIndex >= pb.events.length - 1) {
      setPb((prev) => ({ ...prev, currentIndex: -1, playing: true }));
    } else {
      setPb((prev) => ({ ...prev, playing: true }));
    }
  }, [pb.currentIndex, pb.events.length]);

  const pause = useCallback(() => {
    setPb((prev) => ({ ...prev, playing: false }));
    clearTimer();
  }, [clearTimer]);

  const restart = useCallback(() => {
    clearTimer();
    setPb((prev) => ({ ...prev, currentIndex: -1, playing: true }));
  }, [clearTimer]);

  const step = useCallback((dir: 1 | -1) => {
    clearTimer();
    setPb((prev) => ({
      ...prev,
      playing: false,
      currentIndex: Math.max(-1, Math.min(prev.events.length - 1, prev.currentIndex + dir)),
    }));
  }, [clearTimer]);

  const jumpTo = useCallback((index: number) => {
    clearTimer();
    setPb((prev) => ({ ...prev, playing: false, currentIndex: index }));
  }, [clearTimer]);

  const setSpeed = useCallback((speed: number) => {
    setPb((prev) => ({ ...prev, speed }));
  }, []);

  if (isLoading) {
    return (
      <Card className="p-5">
        <div className="h-4 w-48 bg-muted rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-5 text-center">
        <p className="text-xs text-muted-foreground mb-2">Failed to load transaction history</p>
        <button onClick={() => refetch()} className="text-xs text-primary hover:text-primary/80 transition-colors">
          Retry
        </button>
      </Card>
    );
  }

  if (pb.events.length === 0) {
    return (
      <Card className="p-5 text-center">
        <p className="text-xs text-muted-foreground">No transaction data available for playback</p>
      </Card>
    );
  }

  const currentEvent = pb.currentIndex >= 0 ? pb.events[pb.currentIndex] : null;

  return (
    <Card className="overflow-hidden">
      {/* Playback display */}
      <div className="relative bg-gradient-to-br from-elevated to-elevated/80 p-6">
        <AnimatePresence mode="wait">
          {currentEvent ? (
            <motion.div
              key={currentEvent.id}
              initial={prefersReduced ? undefined : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0, y: -12 }}
              className="flex items-center gap-4"
            >
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                currentEvent.type === "entry" ? "bg-success/10" : "bg-primary/10",
              )}>
                {currentEvent.type === "entry" ? (
                  <LogIn className={cn("h-6 w-6", currentEvent.decision === "granted" ? "text-success" : "text-danger")} />
                ) : (
                  <LogOut className={cn("h-6 w-6", currentEvent.decision === "granted" ? "text-primary" : "text-danger")} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold font-mono">{currentEvent.plate}</span>
                  <Badge
                    variant={currentEvent.decision === "granted" ? "success" : currentEvent.decision === "denied" ? "danger" : "warning"}
                    size="sm"
                  >
                    {currentEvent.decision}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground/70">
                  <span>{currentEvent.gate}</span>
                  {currentEvent.driver && <span>{currentEvent.driver}</span>}
                  {currentEvent.confidence && <span>{currentEvent.confidence.toFixed(1)}%</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-muted-foreground">
                  {currentEvent.timestamp ? new Date(currentEvent.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "--:--:--"}
                </p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                  {currentEvent.type === "entry" ? "Entry" : "Exit"}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={prefersReduced ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 text-muted-foreground/50"
            >
              <Zap className="h-8 w-8" />
              <div>
                <p className="text-sm font-medium">Press Play to start traffic playback</p>
                <p className="text-xs">{pb.events.length} events loaded</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-px bg-border">
        {[
          { label: "Inside", value: stats.inside, icon: Car, color: "text-primary" },
          { label: "Entries", value: stats.entries, icon: LogIn, color: "text-success" },
          { label: "Exits", value: stats.exits, icon: LogOut, color: "text-info" },
          { label: "Denied", value: stats.denied, icon: AlertTriangle, color: "text-danger" },
          { label: "Avg Gap", value: `${Math.round(stats.avgDuration / 1000)}s`, icon: Clock, color: "text-warning" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-elevated/50 p-2.5 text-center">
              <Icon className={cn("mx-auto mb-0.5 h-3.5 w-3.5", s.color)} />
              <p className="text-xs font-semibold tabular-nums">{s.value}</p>
              <p className="text-[9px] text-muted-foreground/60 truncate">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Timeline scrubber */}
      <div className="px-5 py-3">
        <div className="relative h-1.5 rounded-full bg-border overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const idx = Math.floor(pct * pb.events.length) - 1;
            jumpTo(Math.max(-1, Math.min(pb.events.length - 1, idx)));
          }}
        >
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px] text-muted-foreground/40">
          <span>{pb.events[0] ? new Date(pb.events[0].timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
          <span>{pb.currentIndex + 1}/{pb.events.length}</span>
          <span>{pb.events[pb.events.length - 1] ? new Date(pb.events[pb.events.length - 1]!.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-between border-t border-border px-5 py-3">
        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <Button
              key={s}
              variant={pb.speed === s ? "secondary" : "ghost"}
              size="xs"
              onClick={() => setSpeed(s)}
              className="text-[10px]"
            >
              {s}x
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={restart}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => step(-1)} disabled={pb.currentIndex < 0}>
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          <Button variant={pb.playing ? "secondary" : "default"} size="icon-sm" onClick={pb.playing ? pause : play}>
            {pb.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => step(1)} disabled={pb.currentIndex >= pb.events.length - 1}>
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="text-[10px] text-muted-foreground/60 font-mono">
          {pb.currentIndex + 1}/{pb.events.length}
        </div>
      </div>

      {/* Event list */}
      <div className="border-t border-border max-h-48 overflow-y-auto">
        {pb.events.map((evt, i) => {
          const isActive = i === pb.currentIndex;
          const isPast = i < pb.currentIndex;
          return (
            <motion.button
              key={evt.id}
              onClick={() => jumpTo(i)}
              className={cn(
                "w-full flex items-center gap-3 px-5 py-2 text-left transition-colors",
                isActive ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent",
                isPast ? "opacity-60" : "opacity-100",
                !isActive && !isPast && "hover:bg-elevated/50",
              )}
            >
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                evt.type === "entry" ? "bg-success/10" : "bg-primary/10",
              )}>
                {evt.type === "entry" ? (
                  <LogIn className="h-3 w-3 text-success" />
                ) : (
                  <LogOut className="h-3 w-3 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium font-mono">{evt.plate}</span>
                  <Badge
                    variant={evt.decision === "granted" ? "success" : evt.decision === "denied" ? "danger" : "warning"}
                    size="sm"
                    className="text-[8px]"
                  >
                    {evt.decision}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground/60 truncate">{evt.gate} — {evt.driver ?? "Unknown"}</p>
              </div>
              <span className="text-[10px] text-muted-foreground/40 font-mono shrink-0">
                {new Date(evt.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </span>
            </motion.button>
          );
        })}
      </div>
    </Card>
  );
}

export { TrafficPlayback };
