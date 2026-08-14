import { Card } from "@/components/ui/card";
import { PipelineNode } from "./pipeline-node";
import type { StageState } from "../types";

interface PipelineProps {
  stages: StageState[];
  activeStageIndex?: number;
  title?: string;
}

function Pipeline({ stages, activeStageIndex = -1, title = "AI Processing Pipeline" }: PipelineProps) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {stages.map((stage, i) => (
          <div
            key={stage.stage}
            style={{
              opacity: activeStageIndex >= 0 && i > activeStageIndex ? 0.45 : 1,
              transition: "opacity 0.2s",
            }}
          >
            <PipelineNode stage={stage} index={i} />
          </div>
        ))}
      </div>
    </Card>
  );
}

export { Pipeline };
