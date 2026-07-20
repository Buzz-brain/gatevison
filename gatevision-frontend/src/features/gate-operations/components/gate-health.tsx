import { motion } from "framer-motion";
import { DoorOpen, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { type GateInfo, type HealthState } from "../types";
import { healthConfig } from "../utils";

interface GateHealthProps {
  gates: GateInfo[];
}

const SUBSYSTEMS: (keyof GateInfo["health"])[] = [
  "camera",
  "barrier",
  "network",
  "ai",
  "rfid",
  "power",
];

export function GateHealth({ gates }: GateHealthProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gates.map((gate, i) => (
        <motion.div
          key={gate.id}
          initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
          animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.03 }}
        >
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold">
              <DoorOpen className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{gate.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {SUBSYSTEMS.map((key) => {
                const state = gate.health[key] as HealthState | undefined;
                const cfg = state ? healthConfig[state] : undefined;
                const label = cfg?.label ?? "Unknown";
                const dot = cfg?.dot ?? "#64748b";
                return (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: dot }}
                    />
                    <span className="capitalize text-muted-foreground">{key}</span>
                    <span className="ml-auto text-xs">{label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              <span>System health</span>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
