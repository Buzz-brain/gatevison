import { useState } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ConfidenceGauge } from "./confidence-gauge";
import type { ExplainableAIData } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface ExplainableAIProps {
  data: ExplainableAIData | null;
}

function ExplainableAI({ data }: ExplainableAIProps) {
  const [open, setOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  if (!data) return null;

  const factors = [
    { label: "Plate Match", ...data.plateMatch, icon: "📋" },
    { label: "Driver Match", ...data.driverMatch, icon: "👤" },
    { label: "Vehicle Match", ...data.vehicleMatch, icon: "🚗" },
    { label: "Policy Check", ...data.policyCheck, icon: "📜" },
  ];

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Why did AI make this decision?</span>
        </div>
        <ChevronRight className={cn(
          "h-4 w-4 text-muted-foreground/50 transition-transform",
          open && "rotate-90",
        )} />
      </button>

      <motion.div
        initial={prefersReduced ? undefined : { height: 0, opacity: 0 }}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="border-t border-border p-4">
          {/* Factor bars */}
          <div className="space-y-2.5">
            {factors.map((f, i) => (
              <motion.div
                key={f.label}
                initial={prefersReduced ? undefined : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span>{f.icon}</span>
                    {f.label}
                  </span>
                  <span className={cn(
                    "font-mono",
                    f.passed ? "text-success" : "text-danger",
                  )}>
                    {f.confidence.toFixed(1)}% · {f.passed ? "Pass" : "Fail"}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", f.passed ? "bg-success" : "bg-danger")}
                    initial={prefersReduced ? { width: 0 } : { width: 0 }}
                    animate={{ width: `${f.confidence}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Final score */}
          <div className="mt-4 flex items-center justify-between rounded-lg bg-elevated p-3">
            <span className="text-xs font-medium">Final Decision Score</span>
            <ConfidenceGauge value={data.finalScore} size={56} strokeWidth={6} label="Score" />
          </div>
        </div>
      </motion.div>
    </Card>
  );
}

export { ExplainableAI };
