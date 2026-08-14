import { useEffect, useState } from "react";
import { Loader2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACTION_HINTS: Record<string, string> = {
  vehicle_detection: "Scanning the image for the vehicle...",
  plate_detection: "Locating the license plate in the frame...",
  ocr: "Reading the plate characters - this can take a few seconds...",
  face_recognition: "Checking for the driver's face...",
  vehicle_fingerprint: "Extracting vehicle characteristics...",
  identity_verification: "Verifying identity against records...",
  decision: "Evaluating the access decision...",
};

interface ProcessingStatusProps {
  isProcessing: boolean;
  activeStageKey?: string;
  activeLabel?: string;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function ProcessingStatus({
  isProcessing,
  activeStageKey,
  activeLabel,
}: ProcessingStatusProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!isProcessing) {
      setElapsedMs(0);
      return;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(timer);
  }, [isProcessing]);

  if (!isProcessing) return null;

  const hint =
    (activeStageKey && ACTION_HINTS[activeStageKey]) ||
    "Processing the image through the AI pipeline...";

  return (
    <Card className={cn("p-4", "border-primary/30 bg-primary/[0.04]")}>
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {activeLabel ? `${activeLabel} in progress` : "Processing"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {formatElapsed(elapsedMs)}
        </div>
      </div>
    </Card>
  );
}

export { ProcessingStatus };
