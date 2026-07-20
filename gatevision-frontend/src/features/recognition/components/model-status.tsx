import { motion } from "framer-motion";
import { Cpu, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useModelStatus } from "../hooks/use-recognition-api";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const statusConfig = {
  healthy: { dot: "bg-success", text: "text-success" },
  degraded: { dot: "bg-warning", text: "text-warning" },
  offline: { dot: "bg-danger", text: "text-danger" },
};

function ModelStatus() {
  const prefersReduced = useReducedMotion();
  const { data: models, isLoading, isError } = useModelStatus();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Cpu className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Model Status</h3>
      </div>

      <div className="space-y-2">
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {isError && (
          <p className="py-2 text-center text-[10px] text-muted-foreground/50">Failed to load model status</p>
        )}
        {(models ?? []).map((model, i) => {
          const config = statusConfig[model.status];
          return (
            <motion.div
              key={model.name}
              initial={prefersReduced ? undefined : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-lg border border-border bg-surface p-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
                  <span className="text-xs font-medium">{model.name}</span>
                </div>
                <span className={cn("text-[10px] font-mono", config.text)}>
                  {model.status}
                </span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/60">
                <span>v{model.version}</span>
                <span className="flex items-center gap-1">
                  <Activity className="h-2.5 w-2.5" />
                  {model.latency_ms}ms
                </span>
                <span>{model.gpu}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

export { ModelStatus };
