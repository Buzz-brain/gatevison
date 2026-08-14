import { Car, Type, UserCheck } from "lucide-react";
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
      <div className="space-y-2">
        {results.map((result) => {
          const Icon = icons[result.label as keyof typeof icons] || Car;
          const color = result.confidence >= 90 ? "text-success" :
                        result.confidence >= 70 ? "text-warning" : "text-danger";
          return (
            <div key={result.label} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2">
              <Icon className={cn("h-3.5 w-3.5 shrink-0", color)} />
              <span className="flex-1 text-[11px] font-medium">{result.label}</span>
              <span className={cn("text-[10px] font-mono", color)}>{result.confidence.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export { CroppedResults };
