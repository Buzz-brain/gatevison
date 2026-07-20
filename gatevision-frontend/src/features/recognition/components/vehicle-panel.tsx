import { motion } from "framer-motion";
import { Car, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ConfidenceGauge } from "./confidence-gauge";
import type { VehicleFingerprint } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface VehiclePanelProps {
  vehicle: VehicleFingerprint | null;
}

function VehiclePanel({ vehicle }: VehiclePanelProps) {
  if (!vehicle) return null;
  const prefersReduced = useReducedMotion();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Car className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">Vehicle Fingerprint</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground/50">Detected</p>
          <div className="aspect-video rounded bg-gradient-to-br from-blue-500/10 to-blue-600/5 flex items-center justify-center">
            <Car className="h-8 w-8 text-muted-foreground/40" />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-2">
          <p className="mb-1 text-[9px] uppercase tracking-wider text-muted-foreground/50">Reference</p>
          <div className="aspect-video rounded bg-gradient-to-br from-green-500/10 to-green-600/5 flex items-center justify-center">
            <Car className="h-8 w-8 text-success/40" />
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-elevated p-3">
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground/60">Matched Vehicle</p>
          <p className="truncate text-sm font-medium">{vehicle.referenceVehicle}</p>
        </div>
        <ConfidenceGauge value={vehicle.similarity} size={60} strokeWidth={6} label="Similarity" />
      </div>

      <div className="mt-2">
        <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground/50">Top Features</p>
        <div className="flex flex-wrap gap-1">
          {vehicle.features.map((f) => (
            <span key={f} className="rounded bg-elevated px-2 py-0.5 text-[10px] text-muted-foreground/80">
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-muted-foreground/60">
          <Cpu className="h-3 w-3" />
          Embedding Score: <span className="font-mono">{vehicle.embeddingScore.toFixed(3)}</span>
        </span>
      </div>
    </Card>
  );
}

export { VehiclePanel };
