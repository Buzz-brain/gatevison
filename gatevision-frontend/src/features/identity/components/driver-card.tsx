import { motion } from "framer-motion";
import { Car, ShieldCheck, MoreHorizontal, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { statusConfig, initials, formatRelative } from "../utils";
import type { DriverProfile } from "../types";

interface DriverCardProps {
  driver: DriverProfile;
  onOpen: (driver: DriverProfile) => void;
}

function DriverCard({ driver, onOpen }: DriverCardProps) {
  const prefersReduced = useReducedMotion();
  const status = statusConfig[driver.status];

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
        onClick={() => onOpen(driver)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(driver); } }}
        className="group cursor-pointer p-4 transition-colors hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-start gap-3">
          <div className={cn("relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-sm font-semibold text-white", driver.photoColor)}>
            {initials(driver.name)}
            {driver.status === "verified" && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-elevated">
                <ShieldCheck className="h-3 w-3 text-success" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">{driver.name}</p>
            </div>
            <p className="text-[10px] text-muted-foreground/60 font-mono">{driver.employeeId}</p>
            <p className="truncate text-xs text-muted-foreground/70">{driver.department} · {driver.role}</p>
          </div>
          <Badge variant={status.variant} size="sm">{status.label}</Badge>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <Car className="h-3 w-3" />
            {driver.registeredVehicles.length} vehicle{driver.registeredVehicles.length !== 1 ? "s" : ""}
          </span>
          <span className="font-mono">{driver.accessLevel.split(" — ")[0]}</span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground/50">Last: {formatRelative(driver.lastAccess)}</span>
          <span className="flex items-center gap-1 text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
            <Eye className="h-3 w-3" /> View
          </span>
        </div>
      </Card>
    </motion.div>
  );
}

export { DriverCard };
