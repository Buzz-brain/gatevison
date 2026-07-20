import { motion } from "framer-motion";
import { UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ConfidenceGauge } from "./confidence-gauge";
import type { FaceMatch } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface FacePanelProps {
  face: FaceMatch | null;
}

function FacePanel({ face }: FacePanelProps) {
  if (!face) return null;
  const prefersReduced = useReducedMotion();
  const isMatched = face.detected && face.similarity >= 70;

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <UserCheck className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Face Recognition</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Live image */}
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground/50">Live Capture</p>
          <div className="aspect-square rounded bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center">
            <UserCheck className="h-10 w-10 text-muted-foreground/40" />
          </div>
        </div>

        {/* Reference image */}
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground/50">Reference</p>
          <div className="aspect-square rounded bg-gradient-to-br from-green-500/10 to-green-600/5 flex items-center justify-center">
            <UserCheck className="h-10 w-10 text-success/40" />
          </div>
        </div>
      </div>

      {/* Similarity */}
      <div className="mt-3 flex items-center justify-between rounded-lg bg-elevated p-3">
        <div>
          <p className="text-[10px] text-muted-foreground/60">Matched Driver</p>
          <p className="text-sm font-medium">{face.matchedDriver ?? "Unknown"}</p>
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
