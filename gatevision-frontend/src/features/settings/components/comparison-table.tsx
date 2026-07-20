import { motion } from "framer-motion";
import {
  Columns3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { MOCK_SETTINGS } from "../mocks/data";
import type { SettingDefinition } from "../types";

interface ComparisonRow {
  id: string;
  label: string;
  category: string;
  current: string;
  default: string;
  recommended: string;
  matchStatus: "match" | "different" | "concerning";
}

function buildComparisonRows(): ComparisonRow[] {
  const settingsWithRecommended = MOCK_SETTINGS.filter(
    (s) => s.recommendedValue !== undefined
  );

  return settingsWithRecommended.map((s: SettingDefinition) => {
    const current = formatVal(s.value);
    const def = formatVal(s.defaultValue);
    const rec = formatVal(s.recommendedValue!);

    let status: ComparisonRow["matchStatus"] = "match";
    if (current !== rec) {
      const isDangerous = s.isDangerous || s.affectsAccuracy || s.affectsPerformance;
      status = isDangerous ? "concerning" : "different";
    }

    return {
      id: s.id,
      label: s.label,
      category: s.category,
      current,
      default: def,
      recommended: rec,
      matchStatus: status,
    };
  });
}

function formatVal(v: string | number | boolean | undefined): string {
  if (v === undefined) return "-";
  if (typeof v === "boolean") return v ? "Enabled" : "Disabled";
  return String(v);
}

const STATUS_ICONS = {
  match: CheckCircle,
  different: AlertTriangle,
  concerning: XCircle,
};

const STATUS_COLORS = {
  match: "text-success",
  different: "text-warning",
  concerning: "text-danger",
};

const STATUS_BG = {
  match: "bg-success/5",
  different: "bg-warning/5",
  concerning: "bg-danger/5",
};

function ComparisonTable() {
  const prefersReduced = useReducedMotion();
  const rows = buildComparisonRows();
  const matchCount = rows.filter((r) => r.matchStatus === "match").length;
  const diffCount = rows.filter((r) => r.matchStatus !== "match").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Columns3 className="h-4 w-4 text-primary" />
          Settings Comparison
        </CardTitle>
        <CardDescription>
          Current vs Default vs Recommended for each setting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground/60">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" />
            {matchCount} matching
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-warning" />
            {diffCount} different
          </span>
        </div>

        <ScrollArea className="max-h-[500px]">
          <motion.div
            variants={prefersReduced ? undefined : staggerContainer}
            initial={prefersReduced ? undefined : "hidden"}
            animate="visible"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground/60">Setting</th>
                  <th className="pb-2 px-4 text-left text-xs font-medium text-muted-foreground/60">Current</th>
                  <th className="pb-2 px-4 text-center text-xs font-medium text-muted-foreground/60">
                    <ArrowRight className="mx-auto h-3 w-3" />
                  </th>
                  <th className="pb-2 px-4 text-left text-xs font-medium text-muted-foreground/60">Default</th>
                  <th className="pb-2 px-4 text-center text-xs font-medium text-muted-foreground/60">
                    <ArrowRight className="mx-auto h-3 w-3" />
                  </th>
                  <th className="pb-2 pl-4 text-left text-xs font-medium text-muted-foreground/60">Recommended</th>
                  <th className="pb-2 pl-4 text-center text-xs font-medium text-muted-foreground/60">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const StatusIcon = STATUS_ICONS[row.matchStatus];
                  return (
                    <motion.tr
                      key={row.id}
                      variants={prefersReduced ? undefined : staggerItem}
                      initial={prefersReduced ? undefined : "hidden"}
                      animate="visible"
                      transition={{ delay: prefersReduced ? 0 : idx * 0.02 }}
                      className={cn(
                        "border-b border-border/30 transition-colors",
                        STATUS_BG[row.matchStatus],
                        "hover:bg-elevated/50"
                      )}
                    >
                      <td className="py-2.5 pr-4">
                        <div>
                          <p className="text-xs font-medium">{row.label}</p>
                          <p className="text-[10px] text-muted-foreground/50">{row.category}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">
                          {row.current}
                        </code>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <ArrowRight className="mx-auto h-3 w-3 text-muted-foreground/30" />
                      </td>
                      <td className="py-2.5 px-4">
                        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-muted-foreground/70">
                          {row.default}
                        </code>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <ArrowRight className="mx-auto h-3 w-3 text-muted-foreground/30" />
                      </td>
                      <td className="py-2.5 pl-4">
                        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">
                          {row.recommended}
                        </code>
                      </td>
                      <td className="py-2.5 pl-4 text-center">
                        <StatusIcon className={cn("mx-auto h-4 w-4", STATUS_COLORS[row.matchStatus])} />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export { ComparisonTable };
