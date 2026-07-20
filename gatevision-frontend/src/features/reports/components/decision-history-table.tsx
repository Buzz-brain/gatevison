import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DECISION_CONFIG, formatNumber, formatPct } from "../utils";

interface DecisionStage {
  stage: string;
  status: string;
  label: string;
  detail?: string;
  confidence?: number;
  timestamp?: string;
}

interface DecisionHistoryItem {
  id: string;
  plate: string;
  driver: string;
  vehicle: string;
  decision: "granted" | "denied" | "manual_review";
  confidence: number;
  timestamp: string;
  processingMs: number;
  stages: DecisionStage[];
}

interface DecisionHistoryTableProps {
  data: DecisionHistoryItem[];
  isLoading: boolean;
  isError: boolean;
  onSelect?: (id: string) => void;
}

function decisionVariant(d: DecisionHistoryItem["decision"]): "success" | "danger" | "warning" {
  switch (d) {
    case "granted":
      return "success";
    case "denied":
      return "danger";
    case "manual_review":
      return "warning";
  }
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

function DecisionHistorySkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <div key={j} className="h-4 flex-1 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function DecisionHistoryError() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load decision history.</p>
      </div>
    </Card>
  );
}

function DecisionHistoryEmpty() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No decision history available.</p>
      </div>
    </Card>
  );
}

function DecisionRow({
  item,
  onSelect,
}: {
  item: DecisionHistoryItem;
  onSelect?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback(() => {
    setExpanded((v) => !v);
    onSelect?.(item.id);
  }, [item.id, onSelect]);

  const decisionCfg = DECISION_CONFIG[item.decision];

  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/50 hover:bg-muted/30"
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter") toggle();
        }}
        tabIndex={0}
      >
        <td className="px-3 py-2.5 text-foreground">
          <span className="inline-flex items-center gap-1.5">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            {formatTimestamp(item.timestamp)}
          </span>
        </td>
        <td className="px-3 py-2.5 font-medium text-foreground">{item.plate}</td>
        <td className="px-3 py-2.5 text-foreground">{item.driver}</td>
        <td className="px-3 py-2.5 text-foreground">{item.vehicle}</td>
        <td className="px-3 py-2.5">
          <Badge variant={decisionVariant(item.decision)} size="sm">
            {decisionCfg?.label ?? item.decision}
          </Badge>
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-foreground">
          {formatPct(item.confidence)}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
          {formatNumber(item.processingMs)}ms
        </td>
      </tr>
      {expanded && item.stages.length > 0 && (
        <tr className="bg-muted/20">
          <td colSpan={7} className="px-6 py-3">
            <div className="space-y-1.5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Pipeline Stages</p>
              <div className="flex flex-wrap gap-2">
                {item.stages.map((stage, i) => (
                  <div
                    key={`${stage.stage}-${i}`}
                    className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-medium text-foreground">{stage.label}</span>
                    {stage.confidence !== undefined && (
                      <span className="text-muted-foreground">{formatPct(stage.confidence)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function DecisionHistoryTable({
  data,
  isLoading,
  isError,
  onSelect,
}: DecisionHistoryTableProps) {
  if (isLoading) return <DecisionHistorySkeleton />;
  if (isError) return <DecisionHistoryError />;
  if (!data || data.length === 0) return <DecisionHistoryEmpty />;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Plate</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Driver</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Vehicle</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Decision</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Confidence</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <DecisionRow key={item.id} item={item} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
