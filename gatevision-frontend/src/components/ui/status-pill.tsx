import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        healthy: "bg-success/10 text-success",
        active: "bg-success/10 text-success",
        granted: "bg-success/10 text-success",
        inside: "bg-success/10 text-success",
        success: "bg-success/10 text-success",
        degraded: "bg-warning/10 text-warning",
        pending: "bg-warning/10 text-warning",
        review: "bg-warning/10 text-warning",
        warning: "bg-warning/10 text-warning",
        unhealthy: "bg-danger/10 text-danger",
        denied: "bg-danger/10 text-danger",
        error: "bg-danger/10 text-danger",
        danger: "bg-danger/10 text-danger",
        inactive: "bg-elevated text-muted-foreground",
        unknown: "bg-elevated text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "unknown",
    },
  },
);

interface StatusPillProps
  extends VariantProps<typeof statusPillVariants> {
  label?: string;
  className?: string;
}

function StatusPill({ status, label, className }: StatusPillProps) {
  const displayLabel = label ?? status ?? "unknown";
  return (
    <span className={cn(statusPillVariants({ status }), className)}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "healthy" || status === "active" || status === "granted" || status === "inside" || status === "success"
            ? "bg-success"
            : status === "degraded" || status === "pending" || status === "review" || status === "warning"
              ? "bg-warning"
              : status === "unhealthy" || status === "denied" || status === "error" || status === "danger"
                ? "bg-danger"
                : "bg-muted-foreground",
        )}
      />
      {displayLabel}
    </span>
  );
}

export { StatusPill };
