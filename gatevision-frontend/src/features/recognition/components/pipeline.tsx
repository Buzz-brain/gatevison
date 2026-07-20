import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { PipelineNode } from "./pipeline-node";
import type { StageState } from "../types";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface PipelineProps {
  stages: StageState[];
  activeStageIndex?: number;
  title?: string;
}

function Pipeline({ stages, activeStageIndex = -1, title = "AI Processing Pipeline" }: PipelineProps) {
  const prefersReduced = useReducedMotion();

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="space-y-0">
        {stages.map((stage, i) => (
          <motion.div
            key={stage.stage}
            initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
            animate={{
              opacity: activeStageIndex >= 0 && i > activeStageIndex ? 0.4 : 1,
              y: 0,
            }}
            transition={{ duration: 0.2 }}
          >
            <PipelineNode
              stage={stage}
              index={i}
              isLast={i === stages.length - 1}
            />
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

export { Pipeline };
