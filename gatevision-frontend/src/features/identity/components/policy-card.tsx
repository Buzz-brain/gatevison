import { motion } from "framer-motion";
import { ShieldCheck, Users, Car, Copy, Pencil, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { policyTypeConfig } from "../utils";
import type { AccessPolicy } from "../types";

interface PolicyCardProps {
  policy: AccessPolicy;
  onEdit: (policy: AccessPolicy) => void;
  onDuplicate: (policy: AccessPolicy) => void;
  onPreview: (policy: AccessPolicy) => void;
}

function PolicyCard({ policy, onEdit, onDuplicate, onPreview }: PolicyCardProps) {
  const prefersReduced = useReducedMotion();
  const config = policyTypeConfig[policy.type];

  return (
    <motion.div
      initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={prefersReduced ? undefined : { y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="p-4 transition-colors hover:border-primary/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", config.bg, config.border, "border")}>
              <ShieldCheck className={cn("h-4 w-4", config.color)} />
            </div>
            <div>
              <p className="text-sm font-medium">{policy.name}</p>
              <Badge variant="neutral" size="sm">{config.label}</Badge>
            </div>
          </div>
          <span className="rounded bg-elevated px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70">
            P{String(policy.priority).padStart(2, "0")}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {policy.allowedGates.slice(0, 3).map((g) => (
            <span key={g} className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground/70">{g}</span>
          ))}
          {policy.allowedGates.length > 3 && (
            <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground/50">+{policy.allowedGates.length - 3}</span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[10px] text-muted-foreground/60">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {policy.driverIds.length} drivers</span>
          <span className="flex items-center gap-1"><Car className="h-3 w-3" /> {policy.vehicleIds.length} vehicles</span>
        </div>

        <div className="mt-3 flex items-center gap-1">
          <Button variant="ghost" size="xs" className="flex-1 gap-1" onClick={() => onPreview(policy)}>
            <Eye className="h-3 w-3" /> Preview
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => onEdit(policy)} aria-label="Edit">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => onDuplicate(policy)} aria-label="Duplicate">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export { PolicyCard };
