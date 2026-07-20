import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { User, Car, ShieldCheck, DoorOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { RelationshipNode, RelationshipEdge, GraphNodeType } from "../types";

interface RelationshipGraphProps {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

const nodeConfig: Record<GraphNodeType, { color: string; bg: string; border: string; icon: typeof User }> = {
  driver: { color: "text-primary", bg: "bg-primary/10", border: "border-primary/40", icon: User },
  vehicle: { color: "text-success", bg: "bg-success/10", border: "border-success/40", icon: Car },
  policy: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/40", icon: ShieldCheck },
  gate: { color: "text-info", bg: "bg-info/10", border: "border-info/40", icon: DoorOpen },
};

const COLUMN_X: Record<GraphNodeType, number> = {
  driver: 70, vehicle: 250, policy: 430, gate: 610,
};

function RelationshipGraph({ nodes, edges }: RelationshipGraphProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const prefersReduced = useReducedMotion();

  const positioned = useMemo(() => {
    const byType: Record<GraphNodeType, RelationshipNode[]> = { driver: [], vehicle: [], policy: [], gate: [] };
    nodes.forEach((n) => byType[n.type].push(n));
    const result: Record<string, { x: number; y: number }> = {};
    (Object.keys(byType) as GraphNodeType[]).forEach((type) => {
      const list = byType[type];
      list.forEach((n, i) => {
        result[n.id] = { x: COLUMN_X[type], y: 40 + i * Math.max(70, 320 / Math.max(1, list.length)) };
      });
    });
    return result;
  }, [nodes]);

  const neighbors = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>([selected]);
    edges.forEach((e) => {
      if (e.from === selected) set.add(e.to);
      if (e.to === selected) set.add(e.from);
    });
    return set;
  }, [selected, edges]);

  const isEdgeActive = (e: RelationshipEdge) =>
    selected === e.from || selected === e.to ||
    (neighbors.has(e.from) && neighbors.has(e.to) && selected !== null);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">Identity Relationship Graph</h3>
        <span className="text-[10px] text-muted-foreground/50">Click a node to explore</span>
      </div>

      <div className="relative overflow-x-auto">
        <svg viewBox="0 0 680 340" className="w-full min-w-[600px] h-auto">
          {edges.map((e, i) => {
            const from = positioned[e.from];
            const to = positioned[e.to];
            if (!from || !to) return null;
            const active = isEdgeActive(e);
            const midX = (from.x + to.x) / 2;
            return (
              <g key={i}>
                <path
                  d={`M ${from.x + 22} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x - 22} ${to.y}`}
                  fill="none"
                  stroke={active ? "rgb(59 130 246)" : "currentColor"}
                  className={cn(active ? "" : "text-border", "transition-all")}
                  strokeWidth={active ? 2 : 1}
                  opacity={selected && !active ? 0.2 : 0.8}
                  strokeDasharray={e.label === "Allows" ? "4 3" : undefined}
                />
              </g>
            );
          })}

          {nodes.map((node) => {
            const pos = positioned[node.id];
            if (!pos) return null;
            const config = nodeConfig[node.type];
            const Icon = config.icon;
            const isSelected = selected === node.id;
            const isNeighbor = neighbors.has(node.id);
            const dim = selected !== null && !isNeighbor && !isSelected;
            return (
              <motion.g
                key={node.id}
                initial={prefersReduced ? undefined : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: dim ? 0.3 : 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelected(isSelected ? null : node.id)}
                className="cursor-pointer"
                style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={22}
                  className={cn("transition-all", config.bg, config.border, "border-2")}
                  strokeWidth={isSelected ? 3 : 2}
                  stroke={isSelected ? "rgb(59 130 246)" : undefined}
                />
                <foreignObject x={pos.x - 10} y={pos.y - 10} width={20} height={20} className={cn(config.color)}>
                  <div className="flex h-5 w-5 items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                </foreignObject>
                <text x={pos.x} y={pos.y + 38} textAnchor="middle" className="fill-foreground text-[11px] font-medium">
                  {node.label}
                </text>
                <text x={pos.x} y={pos.y + 50} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                  {node.sublabel}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 border-t border-border pt-3">
        {(Object.keys(nodeConfig) as GraphNodeType[]).map((type) => {
          const config = nodeConfig[type];
          const Icon = config.icon;
          return (
            <div key={type} className="flex items-center gap-1.5">
              <div className={cn("flex h-5 w-5 items-center justify-center rounded-full", config.bg, config.border, "border")}>
                <Icon className={cn("h-3 w-3", config.color)} />
              </div>
              <span className="text-[10px] capitalize text-muted-foreground/70">{type}</span>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="mt-2 rounded-lg bg-surface p-2.5 text-xs">
          <span className="font-medium">{nodes.find((n) => n.id === selected)?.label}</span>
          <span className="text-muted-foreground/60"> connected to {neighbors.size - 1} node(s)</span>
        </div>
      )}
    </Card>
  );
}

export { RelationshipGraph };
