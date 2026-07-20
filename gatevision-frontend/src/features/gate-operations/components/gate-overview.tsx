import { motion } from "framer-motion";
import { DoorOpen, User, Car, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { type GateInfo } from "../types";
import { gateStatusConfig } from "../utils";

interface GateOverviewProps {
  gates: GateInfo[];
  selectedGateId: string;
  onSelect: (id: string) => void;
}

export function GateOverview({ gates, selectedGateId, onSelect }: GateOverviewProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {gates.map((gate, i) => {
        const selected = gate.id === selectedGateId;
        const status = gateStatusConfig[gate.status];
        return (
          <motion.div
            key={gate.id}
            initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
            animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
          >
            <Card
              className={`cursor-pointer p-4 transition-all hover:shadow-md ${
                selected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelect(gate.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <DoorOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{gate.name}</span>
                </div>
                <Badge variant={status.variant} size="sm">
                  {status.label}
                </Badge>
              </div>

              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate">{gate.officer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Queue: {gate.queue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-3.5 w-3.5" />
                  <span className="truncate font-mono">
                    {gate.currentPlate ?? "No vehicle"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Throughput</span>
                  <span className="font-medium text-foreground">{gate.throughput}/h</span>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
