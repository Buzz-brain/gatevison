import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, ChevronDown, ChevronRight, Server, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/ui/status-pill";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { STATUS_CONFIG, formatUptime } from "../utils";
import type { AiModelInfo } from "../types";

interface ModelRegistryProps {
  models: AiModelInfo[];
}

function ModelNode({
  model,
  isExpanded,
  onToggle,
  reduced,
  index,
  isLast,
}: {
  model: AiModelInfo;
  isExpanded: boolean;
  onToggle: () => void;
  reduced: boolean;
  index: number;
  isLast: boolean;
}) {
  const color = STATUS_CONFIG[model.status].hex;

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: reduced ? 0 : index * 0.08 }}
        className="w-full"
      >
        <div
          className={cn(
            "relative rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
            isExpanded
              ? "border-primary/40 bg-elevated"
              : "border-border bg-surface hover:border-white/12"
          )}
          onClick={onToggle}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`${model.name} - click to ${isExpanded ? "collapse" : "expand"}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
        >
          <div
            className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
            style={{ backgroundColor: color }}
          />

          <div className="flex items-center justify-between px-4 py-3 pl-5">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-lg p-1.5"
                style={{ backgroundColor: `${color}15` }}
              >
                <Server className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold">{model.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" size="sm">
                    v{model.version}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {model.device}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{model.memoryMb} MB</span>
                <span className="text-white/10">|</span>
                <span>{model.loaded ? "Loaded" : "Unloaded"}</span>
              </div>
              <StatusPill
                status={model.status === "down" ? "inactive" : model.status}
                label={STATUS_CONFIG[model.status].label}
              />
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={reduced ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduced ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mx-4 mb-4 mt-1 rounded-lg border border-border bg-elevated/50 p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Details
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span>{model.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inference Count</span>
                        <span className="tabular-nums">
                          {model.inferenceCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Latency</span>
                        <span className="tabular-nums">{model.avgLatencyMs}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Failures</span>
                        <span
                          className={cn(
                            "tabular-nums",
                            model.failureCount > 0 ? "text-danger" : "text-success"
                          )}
                        >
                          {model.failureCount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uptime</span>
                        <span className="tabular-nums">
                          {formatUptime(model.uptimeMs)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Last loaded: {model.lastLoaded}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Configuration
                    </h5>
                    <div className="space-y-1.5">
                      {Object.entries(model.config).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex justify-between text-sm py-0.5 border-b border-border/50 last:border-0"
                        >
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-mono text-xs">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {!isLast && (
        <motion.div
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: reduced ? 0 : index * 0.08 + 0.15 }}
          className="flex flex-col items-center py-1"
        >
          <motion.div
            animate={
              reduced
                ? {}
                : { y: [0, 3, 0] }
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.2,
            }}
          >
            <ArrowDown className="h-5 w-5 text-muted-foreground/40" />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export function ModelRegistry({ models }: ModelRegistryProps) {
  const reduced = useReducedMotion();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-0">
      {models.map((model, i) => (
        <ModelNode
          key={model.id}
          model={model}
          isExpanded={expandedId === model.id}
          onToggle={() =>
            setExpandedId(expandedId === model.id ? null : model.id)
          }
          reduced={reduced}
          index={i}
          isLast={i === models.length - 1}
        />
      ))}
    </div>
  );
}
