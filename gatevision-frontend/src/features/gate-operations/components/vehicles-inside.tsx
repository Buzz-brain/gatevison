import { Car, ArrowRightLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SessionInside } from "../types";

interface VehiclesInsideProps {
  sessions: SessionInside[];
}

function VehiclesInside({ sessions }: VehiclesInsideProps) {
  const count = sessions.length;
  const longest = sessions.reduce<SessionInside | null>((acc, s) => {
    if (!acc) return s;
    return (s.durationMs ?? 0) > (acc.durationMs ?? 0) ? s : acc;
  }, null);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/80">
          Current Vehicles Inside
        </p>
        <span className="flex items-center gap-1.5 text-[10px] text-success">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> LIVE
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Car className="h-7 w-7" />
        </div>
        <div>
          <p className="text-3xl font-semibold tabular-nums leading-none">{count}</p>
          <p className="mt-1 text-xs text-muted-foreground">on premises</p>
        </div>
        <div className="ml-auto min-w-0 border-l border-border pl-4">
          <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
            <ArrowRightLeft className="h-3 w-3" /> Oldest Inside
          </p>
          {longest ? (
            <p className="mt-1 truncate text-xs">
              <span className="font-mono">{longest.plate}</span>
              <span className="ml-1.5 text-muted-foreground">{longest.gate}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground/70">No active sessions</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export { VehiclesInside };
