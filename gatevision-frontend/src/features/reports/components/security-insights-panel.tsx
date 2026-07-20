import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, AlertTriangle, AlertOctagon, Info, ShieldAlert } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { resolveIcon, SEVERITY_CONFIG } from "../utils";
import type { SecurityInsight, SeverityLevel } from "../types";

interface SecurityInsightsPanelProps {
  data: SecurityInsight[];
  onDismiss?: (id: string) => void;
  isLoading?: boolean;
  isError?: boolean;
}

function severityBorderColor(level: SeverityLevel): string {
  const cfg = SEVERITY_CONFIG[level];
  return cfg?.hex ?? "var(--color-border)";
}

function severityIcon(level: SeverityLevel) {
  switch (level) {
    case "critical":
      return <AlertOctagon className="h-4 w-4" />;
    case "high":
      return <AlertTriangle className="h-4 w-4" />;
    case "medium":
      return <ShieldAlert className="h-4 w-4" />;
    case "low":
    default:
      return <Info className="h-4 w-4" />;
  }
}

function severityVariant(level: SeverityLevel): "danger" | "warning" | "info" | "success" {
  switch (level) {
    case "critical":
    case "high":
      return "danger";
    case "medium":
      return "warning";
    case "low":
      return "success";
  }
}

function InsightSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}

function SecurityInsightsPanelSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <InsightSkeleton key={i} />
      ))}
    </div>
  );
}

function SecurityInsightsPanelError() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load security insights.</p>
      </div>
    </Card>
  );
}

function SecurityInsightsPanelEmpty() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No security insights.</p>
      </div>
    </Card>
  );
}

function SecurityInsightCard({
  insight,
  onDismiss,
}: {
  insight: SecurityInsight;
  onDismiss?: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const borderColor = severityBorderColor(insight.severity);
  const IconComponent = resolveIcon(insight.icon);

  return (
    <Card
      className={cn(
        "relative border-l-4 p-4 transition-all",
        !reduced && "hover:shadow-md",
      )}
      style={{ borderLeftColor: borderColor }}
    >
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2 h-6 w-6 p-0"
          onClick={() => onDismiss(insight.id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${borderColor}20` }}
        >
          <span style={{ color: borderColor }}>{severityIcon(insight.severity)}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-1 pr-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{insight.title}</p>
            <Badge variant={severityVariant(insight.severity)} size="sm">
              {SEVERITY_CONFIG[insight.severity]?.label ?? insight.severity}
            </Badge>
          </div>
          <p className="text-sm font-medium text-foreground">{insight.value}</p>
          <p className="text-xs text-muted-foreground">{insight.detail}</p>
          {insight.recommendation && (
            <p className="mt-1 text-xs text-primary">{insight.recommendation}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function SecurityInsightsPanel({
  data,
  onDismiss,
  isLoading,
  isError,
}: SecurityInsightsPanelProps) {
  if (isLoading) return <SecurityInsightsPanelSkeleton />;
  if (isError) return <SecurityInsightsPanelError />;
  if (!data || data.length === 0) return <SecurityInsightsPanelEmpty />;

  return (
    <div className="space-y-3">
      {data.map((insight) => (
        <SecurityInsightCard
          key={insight.id}
          insight={insight}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
