import { Download, Maximize2, Car, Type, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { CroppedResult } from "../types";

interface CroppedResultsProps {
  results: CroppedResult[];
}

const icons = {
  Vehicle: Car,
  Plate: Type,
  Face: UserCheck,
};

function CroppedResults({ results }: CroppedResultsProps) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-medium">Cropped Results</h3>
      <div className="grid grid-cols-3 gap-2">
        {results.map((result) => {
          const Icon = icons[result.label as keyof typeof icons] || Car;
          const color = result.confidence >= 90 ? "text-success" :
                        result.confidence >= 70 ? "text-warning" : "text-danger";
          return (
            <div key={result.label} className="rounded-lg border border-border bg-surface p-2">
              <div className={cn(
                "aspect-video rounded mb-2 flex items-center justify-center bg-gradient-to-br",
                result.confidence >= 90 ? "from-success/10 to-success/5" :
                result.confidence >= 70 ? "from-warning/10 to-warning/5" :
                "from-danger/10 to-danger/5",
              )}>
                <Icon className={cn("h-6 w-6", color)} />
              </div>
              <p className="text-[10px] font-medium">{result.label}</p>
              <div className="flex items-center justify-between mt-0.5">
                <span className={cn("text-[10px] font-mono", color)}>{result.confidence.toFixed(1)}%</span>
                <span className="text-[9px] text-muted-foreground/50">{result.resolution}</span>
              </div>
              <div className="mt-1 flex items-center gap-1">
                <button className="flex-1 rounded bg-elevated py-0.5 text-[9px] text-muted-foreground/70 hover:text-foreground transition-colors flex items-center justify-center gap-0.5">
                  <Maximize2 className="h-2.5 w-2.5" />
                  Expand
                </button>
                <button className="rounded bg-elevated px-1.5 py-0.5 text-muted-foreground/70 hover:text-foreground transition-colors" aria-label="Download">
                  <Download className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export { CroppedResults };
