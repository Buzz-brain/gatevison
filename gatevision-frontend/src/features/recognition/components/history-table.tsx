import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RecognitionHistoryEntry } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface HistoryTableProps {
  entries: RecognitionHistoryEntry[];
  onReplay?: (entry: RecognitionHistoryEntry) => void;
}

const decisionConfig = {
  granted: { variant: "success" as const, label: "Granted" },
  denied: { variant: "danger" as const, label: "Denied" },
  manual_review: { variant: "warning" as const, label: "Review" },
};

function HistoryTable({ entries, onReplay }: HistoryTableProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const prefersReduced = useReducedMotion();

  const filtered = useMemo(() => (entries ?? []).filter((entry) => {
    const matchesQuery =
      entry.plate.toLowerCase().includes(query.toLowerCase()) ||
      entry.driver.toLowerCase().includes(query.toLowerCase()) ||
      entry.vehicle.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || entry.decision === filter;
    return matchesQuery && matchesFilter;
  }), [entries, query, filter]);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Recognition History</h3>
        <div className="flex items-center gap-1">
          {["all", "granted", "denied", "manual_review"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded px-2 py-0.5 text-[10px] capitalize transition-colors",
                filter === f ? "bg-primary/20 text-primary" : "text-muted-foreground/60 hover:bg-elevated",
              )}
            >
              {f === "manual_review" ? "Review" : f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
        <Input
          placeholder="Search plate, driver, vehicle..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground/60 border-b border-border text-left">
              <th className="pb-2 pr-3 font-medium">Plate</th>
              <th className="pb-2 pr-3 font-medium">Driver</th>
              <th className="pb-2 pr-3 font-medium">Vehicle</th>
              <th className="pb-2 pr-3 font-medium">Decision</th>
              <th className="pb-2 pr-3 font-medium">Confidence</th>
              <th className="pb-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => {
              const config = decisionConfig[entry.decision];
              return (
                <motion.tr
                  key={entry.id}
                  initial={prefersReduced ? undefined : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-border/40 last:border-0 hover:bg-elevated/30"
                >
                  <td className="py-2 pr-3 font-mono">{entry.plate}</td>
                  <td className="py-2 pr-3">{entry.driver}</td>
                  <td className="py-2 pr-3 text-muted-foreground/70">{entry.vehicle}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={config.variant} size="sm">{config.label}</Badge>
                  </td>
                  <td className="py-2 pr-3">
                    <span className={cn(
                      "font-mono",
                      entry.confidence >= 90 ? "text-success" :
                      entry.confidence >= 70 ? "text-warning" : "text-danger",
                    )}>
                      {entry.confidence.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onReplay?.(entry)}
                      aria-label="Replay"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground/50">No results found</p>
        )}
      </div>
    </Card>
  );
}

export { HistoryTable };
