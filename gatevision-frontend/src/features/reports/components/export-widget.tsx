import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { FileSpreadsheet, FileJson, FileText, Check, AlertCircle, Loader2 } from "lucide-react";

interface ExportWidgetProps {
  onExport: (format: "csv" | "json" | "excel") => void;
  isExporting: boolean;
  exportResult?: { url?: string; format?: string; status?: string } | null;
  exportError?: string | null;
}

const FORMAT_OPTIONS = [
  { key: "csv" as const, label: "CSV", icon: FileText },
  { key: "json" as const, label: "JSON", icon: FileJson },
  { key: "excel" as const, label: "Excel", icon: FileSpreadsheet },
] as const;

function ExportWidgetInner({
  onExport,
  isExporting,
  exportResult,
  exportError,
}: ExportWidgetProps) {
  const reduced = useReducedMotion();

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Export Data</h3>
          {isExporting && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2
                className={cn(
                  "h-3.5 w-3.5",
                  !reduced && "animate-spin",
                )}
              />
              Exporting...
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {FORMAT_OPTIONS.map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={() => onExport(key)}
              className="flex-1"
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>

        {isExporting && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full bg-primary transition-all duration-300",
                !reduced && "animate-pulse",
              )}
              style={{ width: "60%" }}
            />
          </div>
        )}

        {exportResult?.status === "completed" && exportResult.url && (
          <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 p-2.5">
            <Check className="h-4 w-4 text-success" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Export complete</p>
              <a
                href={exportResult.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline-offset-2 hover:underline"
              >
                Download {exportResult.format?.toUpperCase()} file
              </a>
            </div>
          </div>
        )}

        {exportError && (
          <div className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger/5 p-2.5">
            <AlertCircle className="h-4 w-4 text-danger" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Export failed</p>
              <p className="text-xs text-muted-foreground">{exportError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onExport(exportResult?.format as "csv" | "json" | "excel" ?? "csv")}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export function ExportWidget(props: ExportWidgetProps) {
  return <ExportWidgetInner {...props} />;
}
