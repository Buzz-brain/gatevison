import { motion, AnimatePresence } from "framer-motion";
import { X, Filter, Save, RotateCcw, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PERIOD_LABELS,
  DECISION_CONFIG,
} from "../utils";
import {
  GATE_IDS,
  GATE_NAMES,
  DEPARTMENTS,
  VEHICLE_TYPES,
  POLICY_TYPES,
  DECISION_TYPES,
  RECOGNITION_STATUS,
  type FilterState,
  type PeriodKey,
  type SavedView,
} from "../types";

interface FilterBarProps {
  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  resetFilters: () => void;
  savedViews: SavedView[];
  applyView: (id: string) => void;
  saveView: (name: string) => void;
}

const PERIOD_OPTIONS = (Object.keys(PERIOD_LABELS) as PeriodKey[]).map((p) => ({
  value: p,
  label: PERIOD_LABELS[p]!,
}));

const gateOptions = GATE_IDS.map((g) => ({ value: g, label: GATE_NAMES[g]! }));

function toggleInArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function FilterBar({
  filters,
  setFilters,
  resetFilters,
  savedViews,
  applyView,
  saveView,
}: FilterBarProps) {
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  filters.gates.forEach((g) =>
    chips.push({
      key: `gate-${g}`,
      label: GATE_NAMES[g]!,
      onRemove: () => setFilters({ gates: filters.gates.filter((x) => x !== g) }),
    }),
  );
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
    <div className="rounded-xl border border-border bg-elevated p-3 shadow-card">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1">
          <Label>Date Range</Label>
          <Select
            options={PERIOD_OPTIONS}
            value={filters.period}
            onChange={(e) => setFilters({ period: e.target.value as PeriodKey })}
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <Label>Gate</Label>
          <Select
            placeholder="All gates"
            options={gateOptions}
            value={filters.gates[0] ?? ""}
            onChange={(e) =>
              setFilters({ gates: e.target.value ? [e.target.value as FilterState["gates"][number]] : [] })
            }
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <Label>Vehicle Type</Label>
          <Select
            placeholder="All types"
            options={VEHICLE_TYPES.map((v) => ({ value: v, label: v }))}
            value={filters.vehicleTypes[0] ?? ""}
            onChange={(e) =>
              setFilters({ vehicleTypes: e.target.value ? [e.target.value] : [] })
            }
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <Label>Department</Label>
          <Select
            placeholder="All departments"
            options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            value={filters.departments[0] ?? ""}
            onChange={(e) =>
              setFilters({ departments: e.target.value ? [e.target.value] : [] })
            }
          />
        </div>
        <div className="min-w-[140px] flex-1">
          <Label>Policy</Label>
          <Select
            placeholder="All policies"
            options={POLICY_TYPES.map((p) => ({ value: p, label: p }))}
            value={filters.policies[0] ?? ""}
            onChange={(e) => setFilters({ policies: e.target.value ? [e.target.value] : [] })}
          />
        </div>
        <div className="min-w-[140px] flex-1">
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
        <div className="min-w-[140px] flex-1">
          <Label>Recognition</Label>
          <Select
            placeholder="All status"
            options={RECOGNITION_STATUS.map((s) => ({ value: s, label: s.replace("_", " ") }))}
            value={filters.recognitionStatus[0] ?? ""}
            onChange={(e) =>
              setFilters({ recognitionStatus: e.target.value ? [e.target.value] : [] })
            }
          />
        </div>
        <div className="min-w-[160px] flex-1">
          <Label>Search</Label>
          <Input
            placeholder="Driver or vehicle"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-1.5 pb-0.5">
          <Button variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button variant="secondary" size="sm" onClick={() => saveView(`View ${savedViews.length + 1}`)}>
            <Save className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Bookmark className="h-3.5 w-3.5" />
          Saved:
        </span>
        {savedViews.map((v) => (
          <button
            key={v.id}
            onClick={() => applyView(v.id)}
            className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            {v.name}
          </button>
        ))}
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
