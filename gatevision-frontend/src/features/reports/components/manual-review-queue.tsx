import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, ArrowUpRight } from "lucide-react";
import { formatPct } from "../utils";

interface ManualReviewSummary {
  id: string;
  plate: string;
  driver: string;
  vehicle: string;
  reason: string;
  confidence: number;
  status: "pending" | "resolved" | "escalated";
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

interface ManualReviewQueueProps {
  data: ManualReviewSummary[];
  isLoading: boolean;
  isError: boolean;
  onResolve?: (id: string) => void;
  onEscalate?: (id: string) => void;
}

function statusVariant(status: ManualReviewSummary["status"]): "warning" | "success" | "danger" {
  switch (status) {
    case "pending":
      return "warning";
    case "resolved":
      return "success";
    case "escalated":
      return "danger";
  }
}

function confidenceColor(pct: number): string {
  if (pct >= 70) return "var(--color-success)";
  if (pct >= 40) return "var(--color-warning)";
  return "var(--color-danger)";
}

function ReviewSkeleton() {
  return (
    <div className="space-y-2 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-3 w-48 animate-pulse rounded bg-muted" />
      <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
    </div>
  );
}

function ManualReviewQueueSkeleton() {
  return (
    <Card className="p-3">
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <ReviewSkeleton key={i} />
        ))}
      </div>
    </Card>
  );
}

function ManualReviewQueueError() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Failed to load review queue.</p>
      </div>
    </Card>
  );
}

function ManualReviewQueueEmpty() {
  return (
    <Card className="p-4">
      <div className="flex h-[200px] flex-col items-center justify-center gap-2">
        <CheckCircle className="h-8 w-8 text-success" />
        <p className="text-sm font-medium text-foreground">All clear</p>
        <p className="text-xs text-muted-foreground">No pending manual reviews.</p>
      </div>
    </Card>
  );
}

function ReviewItem({
  item,
  onResolve,
  onEscalate,
}: {
  item: ManualReviewSummary;
  onResolve?: (id: string) => void;
  onEscalate?: (id: string) => void;
}) {
  const isPending = item.status === "pending";

  return (
    <div className="space-y-2 border-b border-border/50 px-3 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground">{item.plate}</span>
          <Badge variant={statusVariant(item.status)} size="sm">
            {item.status}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-muted-foreground">Driver: </span>
          <span className="text-foreground">{item.driver}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Vehicle: </span>
          <span className="text-foreground">{item.vehicle}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{item.reason}</p>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${item.confidence * 100}%`,
              backgroundColor: confidenceColor(item.confidence * 100),
            }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {formatPct(item.confidence * 100)}
        </span>
      </div>
      {isPending && (onResolve || onEscalate) && (
        <div className="flex gap-2 pt-1">
          {onResolve && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onResolve(item.id)}
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Resolve
            </Button>
          )}
          {onEscalate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onEscalate(item.id)}
            >
              <ArrowUpRight className="mr-1 h-3 w-3" />
              Escalate
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function ManualReviewQueue({
  data,
  isLoading,
  isError,
  onResolve,
  onEscalate,
}: ManualReviewQueueProps) {
  if (isLoading) return <ManualReviewQueueSkeleton />;
  if (isError) return <ManualReviewQueueError />;
  if (!data || data.length === 0) return <ManualReviewQueueEmpty />;

  return (
    <Card className="overflow-hidden">
      <div className="divide-y divide-border/50">
        {data.map((item) => (
          <ReviewItem
            key={item.id}
            item={item}
            onResolve={onResolve}
            onEscalate={onEscalate}
          />
        ))}
      </div>
    </Card>
  );
}
