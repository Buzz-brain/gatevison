import { useState } from "react";
import { motion } from "framer-motion";
import { Car, Clock, Timer, MapPin, LogOut, Inbox, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useUIStore } from "@/store/ui-store";
import { useForceCloseSession } from "../hooks/use-gate-operations-api";
import { type SessionInside } from "../types";
import { formatClock, formatDuration } from "../utils";

interface SessionMonitorProps {
  sessions: SessionInside[];
}

export function SessionMonitor({ sessions }: SessionMonitorProps) {
  const prefersReduced = useReducedMotion();
  const addNotification = useUIStore((s) => s.addNotification);
  const forceClose = useForceCloseSession();
  const [pendingClose, setPendingClose] = useState<SessionInside | null>(null);

  const confirmClose = async () => {
    if (!pendingClose) return;
    const target = pendingClose;
    setPendingClose(null);
    try {
      await forceClose.mutateAsync(target.plate);
      addNotification({
        type: "success",
        category: "recognition",
        title: "Session closed",
        description: `Vehicle ${target.plate} was cleared and marked as exited.`,
      });
    } catch (error) {
      addNotification({
        type: "error",
        category: "recognition",
        title: "Failed to close session",
        description: error instanceof Error ? error.message : "Could not close the session. Try again.",
      });
    }
  };

  if (sessions.length === 0) {
    return (
      <Card className="p-4">
        <EmptyState
          icon={<Inbox className="h-6 w-6 text-muted-foreground" />}
          title="No vehicles inside"
          description="All vehicles have exited. Start an Entry process to admit a vehicle."
          className="py-10"
        />
      </Card>
    );
  }

  return (
    <>
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
          const busy = forceClose.isPending && forceClose.variables === s.plate;
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
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant} size="sm">
                      {statusLabel}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setPendingClose(s)}
                      disabled={busy}
                      title={`Force close session for ${s.plate}`}
                    >
                      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
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

      <Dialog
        open={pendingClose !== null}
        onClose={() => setPendingClose(null)}
        title="Force close session?"
        description={`This will mark vehicle ${pendingClose?.plate ?? ""} as exited immediately. Use this to clear a stuck session.`}
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPendingClose(null)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={confirmClose} disabled={forceClose.isPending}>
            {forceClose.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Close session
          </Button>
        </div>
      </Dialog>
    </>
  );
}
