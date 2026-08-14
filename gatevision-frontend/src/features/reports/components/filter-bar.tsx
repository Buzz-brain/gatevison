import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DECISION_CONFIG,
} from "../utils";
import {
  DECISION_TYPES,
  type FilterState,
} from "../types";

interface FilterBarProps {
  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  resetFilters: () => void;
}

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function FilterBar({
  filters,
  setFilters,
  resetFilters,
}: FilterBarProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  filters.decisions.forEach((d) =>
    chips.push({
      key: `dec-${d}`,
      label: DECISION_CONFIG[d as keyof typeof DECISION_CONFIG]?.label ?? d,
      onRemove: () => setFilters({ decisions: filters.decisions.filter((x) => x !== d) }),
    }),
  );
  if (filters.search) {
    chips.push({
      key: "search",
      label: `Search: ${filters.search}`,
      onRemove: () => setFilters({ search: "" }),
    });
  }

  const hasChips = chips.length > 0;

  return (
    <div className="rounded-xl border border-border bg-elevated p-4 shadow-card">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[180px] flex-1">
          <Label>Decision</Label>
          <Select
            placeholder="All decisions"
            options={DECISION_TYPES.map((d) => ({
              value: d,
              label: DECISION_CONFIG[d].label,
            }))}
            value={filters.decisions[0] ?? ""}
            onChange={(e) =>
              setFilters({ decisions: e.target.value ? [e.target.value] : [] })
            }
          />
        </div>
        <div className="min-w-[220px] flex-1">
          <Label>Search</Label>
          <Input
            placeholder="Plate, driver, or request ID"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-1.5 pb-0.5">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {hasChips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3"
          >
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              Active:
            </span>
            {chips.map((c) => (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Badge variant="outline" className="gap-1 pr-1">
                  {c.label}
                  <button
                    onClick={c.onRemove}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-elevated"
                    aria-label={`Remove ${c.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}
