import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { resolveIcon, TONE_CONFIG } from "../utils";
import type { Insight } from "../types";

interface InsightsFeedProps {
  data: Insight[];
  isLoading: boolean;
  isError: boolean;
}

function toneBorderColor(tone: Insight["tone"]): string {
  return TONE_CONFIG[tone]?.hex ?? "var(--color-border)";
}

function toneVariant(tone: Insight["tone"]): "success" | "warning" | "danger" {
  switch (tone) {
    case "positive":
      return "success";
    case "warning":
      return "warning";
    case "critical":
      return "danger";
  }
}

function InsightSkeleton() {
  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
        <div className="h-3 w-48 animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}

function InsightsFeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <InsightSkeleton key={i} />
      ))}
    </div>
  );
}

function InsightsFeedError() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load insights.</p>
      </div>
    </Card>
  );
}

function InsightsFeedEmpty() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">No insights available.</p>
      </div>
    </Card>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const reduced = useReducedMotion();
  const borderColor = toneBorderColor(insight.tone);
  const IconComponent = resolveIcon(insight.icon);
  const cfg = TONE_CONFIG[insight.tone];

  return (
    <Card
      className={cn(
        "border-l-4 p-4 transition-all",
        !reduced && "hover:shadow-md",
      )}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${borderColor}20` }}
        >
          <span style={{ color: borderColor }}>
            <IconComponent className="h-4 w-4" />
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">{insight.title}</p>
            <Badge variant={toneVariant(insight.tone)} size="sm">
              {cfg?.label ?? insight.tone}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{insight.body}</p>
          {insight.recommendation && (
            <p className="text-xs text-primary">{insight.recommendation}</p>
          )}
          {insight.metric && (
            <Badge variant="outline" size="sm" className="mt-1">
              {insight.metric}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}

export function InsightsFeed({ data, isLoading, isError }: InsightsFeedProps) {
  if (isLoading) return <InsightsFeedSkeleton />;
  if (isError) return <InsightsFeedError />;
  if (!data || data.length === 0) return <InsightsFeedEmpty />;

  return (
    <div className="space-y-3">
      {data.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}
