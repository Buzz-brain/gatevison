import { motion } from "framer-motion";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatDate } from "../utils";
import type { ProfileTimelineEvent } from "../types";

interface TimelineProps {
  entries: ProfileTimelineEvent[];
}

const statusDot: Record<string, string> = {
  completed: "bg-success",
  pending: "bg-warning",
  failed: "bg-danger",
};

function Timeline({ entries }: TimelineProps) {
  const prefersReduced = useReducedMotion();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <History className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Enrollment Timeline</h3>
      </div>
      <div className="relative pl-4">
        <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />
        {entries.map((e, i) => (
          <motion.div
            key={e.id}
            initial={prefersReduced ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative pb-4 last:pb-0"
          >
            <span className={cn("absolute -left-4 top-1 h-2.5 w-2.5 rounded-full ring-2 ring-background", statusDot[e.status] || "bg-muted")} />
            <p className="text-xs font-medium">{e.title}</p>
            <p className="text-[9px] text-muted-foreground/40 mt-0.5">{formatDate(e.timestamp)}</p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

export { Timeline };
