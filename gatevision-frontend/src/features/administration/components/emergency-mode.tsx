import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  CameraOff,
  Eye,
  Bell,
  ShieldAlert,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface EmergencyAction {
  id: string;
  label: string;
  description: string;
  icon: typeof Lock;
}

const EMERGENCY_ACTIONS: EmergencyAction[] = [
  {
    id: "lock_gates",
    label: "Lock All Gates",
    description: "Immediately lock every gate and prevent all vehicle passage.",
    icon: Lock,
  },
  {
    id: "disable_recognition",
    label: "Disable Recognition",
    description: "Turn off AI recognition engines across all cameras.",
    icon: CameraOff,
  },
  {
    id: "require_manual",
    label: "Require Manual Review",
    description: "Force all access decisions through manual operator review.",
    icon: Eye,
  },
  {
    id: "broadcast_alert",
    label: "Broadcast Alert",
    description: "Send emergency notification to all personnel and devices.",
    icon: Bell,
  },
  {
    id: "lock_admin",
    label: "Lock Administration",
    description: "Freeze all admin changes and privilege modifications.",
    icon: ShieldAlert,
  },
];

interface EmergencyModeProps {
  open: boolean;
  onClose: () => void;
}

export function EmergencyMode({ open, onClose }: EmergencyModeProps) {
  const reduced = useReducedMotion();
  const [countdown, setCountdown] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"countdown" | "select" | "executing" | "success">(
    "countdown"
  );

  useEffect(() => {
    if (!open) {
      setCountdown(10);
      setSelected(new Set());
      setPhase("countdown");
      return;
    }
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("select");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [open, countdown, phase]);

  function toggleAction(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    setPhase("executing");
    setTimeout(() => setPhase("success"), 2000);
  }

  function handleClose() {
    setPhase("countdown");
    setCountdown(10);
    setSelected(new Set());
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} showClose={false} className="max-w-2xl">
      <div className="relative overflow-hidden rounded-xl border border-red-500/30 bg-[#0a0a0f] p-6">
        {phase === "countdown" && (
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div
              className="text-8xl font-bold text-red-500 tabular-nums"
              key={countdown}
              initial={reduced ? false : { scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.3 }}
            >
              {countdown}
            </motion.div>
            <p className="mt-4 text-sm text-muted-foreground">
              Emergency Mode activating...
            </p>
            <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-surface">
              <motion.div
                className="h-full bg-red-500"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 10, ease: "linear" }}
              />
            </div>
          </div>
        )}

        {phase === "select" && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-red-500">
                  EMERGENCY MODE
                </h2>
                <p className="text-sm text-muted-foreground">
                  Select actions to execute
                </p>
              </div>
              <Button variant="ghost" size="icon-xs" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {EMERGENCY_ACTIONS.map((ea) => {
                const Icon = ea.icon;
                const active = selected.has(ea.id);
                return (
                  <motion.div
                    key={ea.id}
                    whileHover={reduced ? undefined : { scale: 1.02 }}
                    whileTap={reduced ? undefined : { scale: 0.98 }}
                  >
                    <Card
                      className={cn(
                        "cursor-pointer border transition-all",
                        active
                          ? "border-red-500 bg-red-500/10 ring-1 ring-red-500/30"
                          : "border-border hover:border-red-500/30"
                      )}
                      onClick={() => toggleAction(ea.id)}
                    >
                      <CardContent className="flex items-start gap-3 p-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                            active
                              ? "bg-red-500/20 text-red-500"
                              : "bg-red-500/10 text-red-400"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {ea.label}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {ea.description}
                          </p>
                        </div>
                        {active && (
                          <CheckCircle2 className="ml-auto mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={selected.size === 0}
                onClick={handleConfirm}
              >
                Execute ({selected.size})
              </Button>
            </div>
          </>
        )}

        {phase === "executing" && (
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div
              animate={reduced ? {} : { rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="h-12 w-12 text-red-500" />
            </motion.div>
            <p className="mt-4 text-sm font-medium text-red-500">
              Executing emergency actions...
            </p>
            <div className="mt-3 space-y-1">
              {EMERGENCY_ACTIONS.filter((a) => selected.has(a.id)).map((a) => (
                <p key={a.id} className="text-xs text-muted-foreground">
                  {a.label}...
                </p>
              ))}
            </div>
          </div>
        )}

        {phase === "success" && (
          <motion.div
            className="flex flex-col items-center justify-center py-12"
            initial={reduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="mt-4 text-lg font-bold text-green-500">
              Actions Executed
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selected.size} emergency action{selected.size !== 1 ? "s" : ""} completed.
            </p>
            <Button className="mt-5" onClick={handleClose}>
              Close
            </Button>
          </motion.div>
        )}

        {phase !== "countdown" && (
          <div
            className="pointer-events-none absolute inset-0 rounded-xl border-2 border-red-500/20"
            style={{
              boxShadow: "inset 0 0 60px rgba(239,68,68,0.05)",
            }}
          />
        )}
      </div>
    </Dialog>
  );
}
