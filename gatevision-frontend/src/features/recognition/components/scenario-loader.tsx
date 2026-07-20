import { motion } from "framer-motion";
import { History, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRecognitionHistory } from "../hooks/use-recognition-api";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const categoryColors: Record<string, { variant: "default" | "success" | "warning" | "danger" | "info" | "neutral"; }> = {
  granted: { variant: "success" },
  denied: { variant: "danger" },
  manual_review: { variant: "warning" },
};

function ScenarioLoader() {
  const prefersReduced = useReducedMotion();
  const { data } = useRecognitionHistory(1);
  const entries = data?.entries ?? [];

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Recent Recognitions</h3>
        <span className="ml-auto text-[10px] text-muted-foreground/50">
          {data?.total ?? 0} total
        </span>
      </div>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
        {entries.slice(0, 8).map((entry, i) => {
          const color = categoryColors[entry.decision] || { variant: "neutral" as const };
          return (
            <motion.div
              key={entry.id}
              initial={prefersReduced ? undefined : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left",
                "border-border bg-surface",
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-elevated text-muted-foreground">
                <Zap className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-medium font-mono">{entry.plate || "Unknown"}</span>
                  <Badge variant={color.variant} size="sm">{entry.decision === "manual_review" ? "Review" : entry.decision}</Badge>
                </div>
                <p className="truncate text-[10px] text-muted-foreground/60">
                  {entry.driver} · {entry.vehicle}
                </p>
              </div>
            </motion.div>
          );
        })}
        {entries.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground/50">No recognition history yet</p>
        )}
      </div>
    </Card>
  );
}

export { ScenarioLoader };
