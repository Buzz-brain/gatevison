import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Clock, Car } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { type QueueVehicle } from "../types";
import { recognitionConfig, formatEta, confidenceColor } from "../utils";

interface VehicleQueueProps {
  queue: QueueVehicle[];
  onReorder: (id: string, dir: -1 | 1) => void;
}

export function VehicleQueue({ queue, onReorder }: VehicleQueueProps) {
  const prefersReduced = useReducedMotion();

  const sorted = [...queue].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {sorted.map((q, i) => {
          const rec = recognitionConfig[q.recognitionStatus];
          const confText = q.confidence > 0 ? `${q.confidence.toFixed(1)}%` : "—";
          return (
            <motion.div
              key={q.id}
              layout={!prefersReduced}
              initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
              animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
              exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
            >
              <Card className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex w-8 shrink-0 flex-col items-center gap-1">
                    <span className="text-sm font-bold text-muted-foreground">#{q.position}</span>
                    <div className="flex flex-col">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onReorder(q.id, -1)}
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onReorder(q.id, 1)}
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{q.plate}</span>
                      <Badge variant={rec.variant} size="sm">
                        {rec.label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="truncate">{q.driver}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatEta(q.eta)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {q.make} {q.model}
                      </span>
                      <span className="truncate">{q.purpose}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div
                      className="font-mono text-sm font-semibold"
                      style={{ color: confidenceColor(q.confidence) }}
                    >
                      {confText}
                    </div>
                    <div className="text-[10px] uppercase text-muted-foreground">confidence</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
