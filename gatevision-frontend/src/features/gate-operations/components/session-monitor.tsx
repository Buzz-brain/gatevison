import { motion } from "framer-motion";
import { Car, Clock, Timer, MapPin, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { type SessionInside } from "../types";
import { formatClock } from "../utils";
import { formatDuration } from "../utils";

interface SessionMonitorProps {
  sessions: SessionInside[];
}

export function SessionMonitor({ sessions }: SessionMonitorProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((s, i) => {
        const statusVariant =
          s.status === "parked"
            ? "neutral"
            : s.status === "moving"
              ? "info"
              : "warning";
        const statusLabel =
          s.status === "parked" ? "Parked" : s.status === "moving" ? "Moving" : "Exiting";
        return (
          <motion.div
            key={s.id}
            initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
            animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
          >
            <Card className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm font-semibold">{s.plate}</span>
                </div>
                <Badge variant={statusVariant} size="sm">
                  {statusLabel}
                </Badge>
              </div>

              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Entered {formatClock(s.entryTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-3.5 w-3.5" />
                  <span>{formatDuration(s.durationMs)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{s.gate}</span>
                </div>
                {s.expectedExit && (
                  <div className="flex items-center gap-2">
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Exit ~ {formatClock(s.expectedExit)}</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
