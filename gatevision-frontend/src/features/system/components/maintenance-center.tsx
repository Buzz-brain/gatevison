import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw,
  RefreshCw,
  Trash2,
  Activity,
  Camera,
  Play,
  AlertTriangle,
  Settings,
  Wrench,
  CheckCircle2,
  X,
  Terminal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

interface MaintenanceAction {
  id: string;
  label: string;
  icon: typeof RotateCcw;
  color: string;
}

const ACTIONS: MaintenanceAction[] = [
  { id: "restart-model", label: "Restart Model", icon: RotateCcw, color: "#ef4444" },
  { id: "reload-config", label: "Reload Config", icon: RefreshCw, color: "#3b82f6" },
  { id: "clear-cache", label: "Clear Cache", icon: Trash2, color: "#f59e0b" },
  { id: "health-check", label: "Health Check", icon: Activity, color: "#22c55e" },
  { id: "reconnect-cameras", label: "Reconnect Cameras", icon: Camera, color: "#a855f7" },
  { id: "restart-pipeline", label: "Restart Pipeline", icon: Terminal, color: "#06b6d4" },
  { id: "safe-mode", label: "Safe Mode", icon: AlertTriangle, color: "#f59e0b" },
  { id: "maintenance-mode", label: "Maintenance Mode", icon: Settings, color: "#6b7280" },
];

type RunState = "idle" | "confirming" | "running" | "complete";

export function MaintenanceCenter() {
  const reduced = useReducedMotion();
  const [selected, setSelected] = useState<MaintenanceAction | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");

  const handleActionClick = useCallback((action: MaintenanceAction) => {
    setSelected(action);
    setRunState("confirming");
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selected) return;
    setRunState("running");
    setTimeout(() => {
      setRunState("complete");
    }, 1500);
  }, [selected]);

  const handleClose = useCallback(() => {
    setSelected(null);
    setRunState("idle");
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Maintenance Center</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ACTIONS.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: reduced ? 0 : i * 0.05 }}
            >
              <Button
                variant="outline"
                className="w-full h-auto flex-col gap-2.5 py-5 hover:border-white/10"
                onClick={() => handleActionClick(action)}
              >
                <div
                  className="flex items-center justify-center rounded-lg p-2.5"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: action.color }} />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={reduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0, scale: 0.95 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="p-6 w-[380px] shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-lg p-2"
                      style={{ backgroundColor: `${selected.color}15` }}
                    >
                      <selected.icon className="h-5 w-5" style={{ color: selected.color }} />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold">{selected.label}</h4>
                      <p className="text-xs text-muted-foreground">
                        {runState === "confirming" && "Confirm to proceed"}
                        {runState === "running" && "Executing..."}
                        {runState === "complete" && "Operation finished"}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-xs" onClick={handleClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {runState === "confirming" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to execute{" "}
                      <span className="text-foreground font-medium">{selected.label}</span>? This
                      action may temporarily affect system operation.
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button variant="default" size="sm" onClick={handleConfirm}>
                        Confirm
                      </Button>
                    </div>
                  </div>
                )}

                {runState === "running" && (
                  <div className="flex flex-col items-center py-6 gap-3">
                    <motion.div
                      animate={reduced ? {} : { rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="h-8 w-8 text-primary" />
                    </motion.div>
                    <p className="text-sm text-muted-foreground">
                      Running {selected.label}...
                    </p>
                  </div>
                )}

                {runState === "complete" && (
                  <div className="flex flex-col items-center py-6 gap-3">
                    <motion.div
                      initial={reduced ? { scale: 1 } : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                    >
                      <CheckCircle2 className="h-10 w-10 text-success" />
                    </motion.div>
                    <p className="text-sm font-medium">Complete</p>
                    <Button variant="outline" size="sm" onClick={handleClose}>
                      Close
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
