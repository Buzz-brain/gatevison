import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Car, Type, UserCheck, IdCard, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ConfidenceGauge } from "./confidence-gauge";
import type { EvidenceItem } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface EvidencePanelProps {
  evidence: EvidenceItem[];
}

const typeIcons = {
  vehicle: Car,
  plate: Type,
  face: UserCheck,
  identity: IdCard,
  policy: Shield,
};

function EvidencePanel({ evidence }: EvidencePanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-medium">Evidence Explorer</h3>
      <div className="space-y-1.5">
        {evidence.map((item) => {
          const Icon = typeIcons[item.type];
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="rounded-lg border border-border bg-surface overflow-hidden">
              <button
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="flex w-full items-center gap-3 p-3 text-left"
              >
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-md",
                  item.confidence >= 90 ? "bg-success/10 text-success" :
                  item.confidence >= 70 ? "bg-warning/10 text-warning" :
                  "bg-danger/10 text-danger",
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="truncate text-[10px] text-muted-foreground/60">{item.detail}</p>
                </div>
                <ConfidenceGauge value={item.confidence} size={36} strokeWidth={4} showValue={false} />
                <span className="w-10 text-right text-[10px] font-mono text-muted-foreground">
                  {item.confidence.toFixed(0)}%
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground/50 transition-transform",
                  isExpanded && "rotate-180",
                )} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={prefersReduced ? undefined : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border p-3 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-muted-foreground/50">Confidence</p>
                          <p className="font-mono">{item.confidence.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground/50">Type</p>
                          <p className="capitalize">{item.type}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground/50">Detail</p>
                          <p>{item.detail}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export { EvidencePanel };
