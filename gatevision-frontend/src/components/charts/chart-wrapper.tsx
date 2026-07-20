import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ChartWrapperProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
  height?: number;
}

function ChartWrapper({
  title,
  subtitle,
  children,
  className,
  isLoading,
  height = 300,
}: ChartWrapperProps) {
  return (
    <Card className={cn("p-5", className)}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      {isLoading ? (
        <Skeleton className="w-full" style={{ height }} />
      ) : (
        <div style={{ height }}>{children}</div>
      )}
    </Card>
  );
}

export { ChartWrapper };
