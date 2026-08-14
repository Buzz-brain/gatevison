import { motion } from "framer-motion";
import {
  BrainCircuit,
  ScanText,
  UserCheck,
  Network,
  Zap,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/status-pill";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { STATUS_CONFIG } from "../utils";
import type { AiModelInfo, ModelId } from "../types";

interface AiModelGridProps {
  models: AiModelInfo[];
}

const MODEL_ICONS: Record<ModelId, typeof BrainCircuit> = {
  yolo: BrainCircuit,
  easyocr: ScanText,
  insightface: UserCheck,
  resnet50: Network,
  decision: Zap,
};

function ModelCard({
  model,
  index,
  reduced,
}: {
  model: AiModelInfo;
  index: number;
  reduced: boolean;
}) {
  const Icon = MODEL_ICONS[model.id] ?? BrainCircuit;
  const statusColor = STATUS_CONFIG[model.status].hex;

  return (
    <motion.div
      initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduced ? 0 : index * 0.07 }}
    >
      <Card className="p-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-lg p-2"
            style={{ backgroundColor: `${statusColor}15` }}
          >
            <Icon className="h-5 w-5" style={{ color: statusColor }} />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold">{model.name}</h4>
            <p className="truncate text-xs text-muted-foreground">{model.type}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusPill
            status={model.status === "down" ? "inactive" : model.status}
            label={STATUS_CONFIG[model.status].label}
          />
          <Badge variant={model.loaded ? "success" : "neutral"} size="sm">
            {model.loaded ? "Loaded" : "Unloaded"}
          </Badge>
          <Badge variant="outline" size="sm">v{model.version}</Badge>
        </div>
      </Card>
    </motion.div>
  );
}

export function AiModelGrid({ models }: AiModelGridProps) {
  const reduced = useReducedMotion();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {models.map((model, i) => (
        <ModelCard
          key={model.id}
          model={model}
          index={i}
          reduced={reduced}
        />
      ))}
    </div>
  );
}
