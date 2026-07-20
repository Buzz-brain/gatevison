import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, Camera, AlertTriangle } from "lucide-react";
import type { ManualReviewItem } from "../types";
import { confidenceColor } from "../utils";

interface ManualReviewConsoleProps {
  reviews: ManualReviewItem[];
  onResolve: (id: string, status: "approved" | "rejected") => void;
}

const STATUS_VARIANT = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
} as const;

const STATUS_LABEL = {
  pending: "PENDING",
  approved: "APPROVED",
  rejected: "REJECTED",
} as const;

export function ManualReviewConsole({
  reviews,
  onResolve,
}: ManualReviewConsoleProps) {
  return (
    <div className="flex flex-col gap-3">
      {reviews.length === 0 && (
        <Card className="p-4 text-sm text-muted-foreground">
          No items awaiting review.
        </Card>
      )}
      {reviews.map((review) => (
        <Card key={review.id} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium">{review.plate}</span>
              <span className={"text-xs font-mono " + confidenceColor(review.confidence)}>
                {review.confidence.toFixed(1)}%
              </span>
            </div>
            <Badge variant={STATUS_VARIANT[review.status]}>
              {STATUS_LABEL[review.status]}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">{review.driver}</p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Reference
              </p>
              <div className="flex h-28 items-center justify-center rounded-md border border-border bg-elevated text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <UserCheck className="h-6 w-6" />
                  <span className="text-xs">{review.referenceLabel}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Live Capture
              </p>
              <div className="flex h-28 items-center justify-center rounded-md border border-border bg-elevated text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">{review.liveLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {review.differences.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1">
              {review.differences.map((d, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 shrink-0 text-warning" />
                  {d}
                </li>
              ))}
            </ul>
          )}

          {review.status === "pending" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="success"
                onClick={() => onResolve(review.id, "approved")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onResolve(review.id, "rejected")}
              >
                Reject
              </Button>
              <Button size="sm" variant="outline">
                Request Rescan
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              {review.status === "approved"
                ? "Approved by operator."
                : "Rejected by operator."}
              {review.notes ? ` ${review.notes}` : ""}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
