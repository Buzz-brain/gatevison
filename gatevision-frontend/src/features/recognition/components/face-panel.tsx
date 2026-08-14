import { UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ConfidenceGauge } from "./confidence-gauge";
import type { FaceMatch } from "../types";

interface FacePanelProps {
  face: FaceMatch | null;
}

function FacePanel({ face }: FacePanelProps) {
  if (!face) return null;
  const isMatched = face.detected && face.similarity >= 70;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Face Recognition</h3>
      </div>

      {/* Similarity */}
      <div className="flex items-center justify-between rounded-lg bg-elevated p-3">
        <div>
          <p className="text-[10px] text-muted-foreground/60">
            {face.matchSource === "session" ? "Session Driver" : "Matched Driver"}
          </p>
          <p className="text-sm font-medium">
            {face.matchSource === "session"
              ? "Matches entry driver"
              : face.matchedDriver ?? "Unknown"}
          </p>
        </div>
        <ConfidenceGauge value={face.similarity} size={60} strokeWidth={6} label="Similarity" />
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground/60">
          Embedding Distance: <span className="font-mono">{face.embeddingDistance}</span>
        </span>
        <span className={cn(
          "flex items-center gap-1 font-medium",
          isMatched ? "text-success" : "text-danger",
        )}>
          {isMatched ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
          {isMatched ? "Matched" : "Unmatched"}
        </span>
      </div>
    </Card>
  );
}

export { FacePanel };
