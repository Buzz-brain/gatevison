import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, RotateCcw, Trash2, AlertTriangle, Loader2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
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
  onDelete?: (entry: RecognitionHistoryEntry) => void;
  onClear?: () => void;
  isDeleting?: boolean;
  isClearing?: boolean;
}

const decisionConfig = {
  granted: { variant: "success" as const, label: "Granted" },
  denied: { variant: "danger" as const, label: "Denied" },
  manual_review: { variant: "warning" as const, label: "Review" },
};

const directionConfig = {
  entry: {
    label: "Entry",
    icon: ArrowDownToLine,
    cls: "text-success bg-success/10",
  },
  exit: {
    label: "Exit",
    icon: ArrowUpFromLine,
    cls: "text-info bg-info/10",
  },
};

function HistoryTable({ entries, onReplay, onDelete, onClear, isDeleting, isClearing }: HistoryTableProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [dirFilter, setDirFilter] = useState<string>("all");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const prefersReduced = useReducedMotion();

  const filtered = useMemo(() => (entries ?? []).filter((entry) => {
    const matchesQuery =
      entry.plate.toLowerCase().includes(query.toLowerCase()) ||
      entry.driver.toLowerCase().includes(query.toLowerCase()) ||
      entry.vehicle.toLowerCase().includes(query.toLowerCase()) ||
      entry.direction.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "all" || entry.decision === filter;
    const matchesDir = dirFilter === "all" || entry.direction === dirFilter;
    return matchesQuery && matchesFilter && matchesDir;
  }), [entries, query, filter, dirFilter]);

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
          <span className="mx-1 h-3 w-px bg-border" />
          {["all", "entry", "exit"].map((d) => (
            <button
              key={d}
              onClick={() => setDirFilter(d)}
              className={cn(
                "rounded px-2 py-0.5 text-[10px] capitalize transition-colors",
                dirFilter === d ? "bg-info/20 text-info" : "text-muted-foreground/60 hover:bg-elevated",
              )}
            >
              {d === "all" ? "All Directions" : d}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Search plate, driver, vehicle..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        {onClear && (entries ?? []).length > 0 && (
          <div className="flex items-center gap-1.5">
            {confirmingClear && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <AlertTriangle className="h-3 w-3 text-warning" />
                Delete all?
              </span>
            )}
            <Button
              variant={confirmingClear ? "destructive" : "ghost"}
              size="sm"
              disabled={isClearing}
              onClick={() => {
                if (confirmingClear) {
                  setConfirmingClear(false);
                  onClear();
                } else {
                  setConfirmingClear(true);
                }
              }}
              className="gap-1"
            >
              {isClearing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {confirmingClear ? "Confirm Clear" : "Clear History"}
            </Button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground/60 border-b border-border text-left">
              <th className="pb-2 pr-3 font-medium">Plate</th>
              <th className="pb-2 pr-3 font-medium">Driver</th>
              <th className="pb-2 pr-3 font-medium">Vehicle</th>
              <th className="pb-2 pr-3 font-medium">Direction</th>
              <th className="pb-2 pr-3 font-medium">Decision</th>
              <th className="pb-2 pr-3 font-medium">Confidence</th>
              <th className="pb-2 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry, i) => {
              const config = decisionConfig[entry.decision];
              const DirIcon = directionConfig[entry.direction].icon;
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
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
                      directionConfig[entry.direction].cls,
                    )}>
                      <DirIcon className="h-3 w-3" />
                      {directionConfig[entry.direction].label}
                    </span>
                  </td>
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
                    <div className="flex items-center justify-end gap-1">
                      {onReplay && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onReplay(entry)}
                          aria-label="Replay"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDelete(entry)}
                          disabled={isDeleting}
                          aria-label={`Delete ${entry.plate}`}
                          className="text-muted-foreground hover:text-danger"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground/50">
            {query || filter !== "all" || dirFilter !== "all" ? "No results found" : "No history yet"}
          </p>
        )}
      </div>
    </Card>
  );
}

export { HistoryTable };
