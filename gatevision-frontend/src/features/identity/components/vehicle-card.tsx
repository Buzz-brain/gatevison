import { motion } from "framer-motion";
import { User, Eye, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { vehicleStatusConfig, formatRelative } from "../utils";
import type { VehicleProfile } from "../types";

interface VehicleCardProps {
  vehicle: VehicleProfile;
  onOpen: (vehicle: VehicleProfile) => void;
}

function VehicleCard({ vehicle, onOpen }: VehicleCardProps) {
  const prefersReduced = useReducedMotion();
  const status = vehicleStatusConfig[vehicle.status];

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReduced ? undefined : { y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onOpen(vehicle)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(vehicle); } }}
        className="group cursor-pointer p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-start gap-3">
          <div className={cn("relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white", vehicle.fingerprintPreviewColor)}>
            <span className="font-mono text-[11px] font-bold">{vehicle.plate.slice(0, 2)}</span>
            {vehicle.status === "active" && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-elevated">
                <ShieldCheck className="h-3 w-3 text-success" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm font-medium">{vehicle.plate}</p>
            <p className="truncate text-xs text-muted-foreground/70">{vehicle.make} {vehicle.model} · {vehicle.year}</p>
            <p className="truncate text-[10px] text-muted-foreground/50">{vehicle.color}</p>
          </div>
          <Badge variant={status.variant} size="sm">{status.label}</Badge>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground/60">
          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {vehicle.ownerName}</span>
          <span className="font-mono">{vehicle.recognitionAccuracy.toFixed(0)}% acc</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/50">Last seen: {formatRelative(vehicle.lastSeen)}</span>
          <span className="flex items-center gap-1 text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
            <Eye className="h-3 w-3" /> View
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

export { VehicleCard };
