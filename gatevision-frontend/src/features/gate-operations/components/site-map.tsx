import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Card } from "@/components/ui/card";
import type { SiteMapNode, SiteMapEdge, MovingVehicle, GateInfo } from "../types";
import { gateStatusConfig } from "../utils";

function gateClasses(status: GateInfo["status"] | undefined): string {
  switch (status) {
    case "open":
      return "text-success border-success";
    case "processing":
      return "text-warning border-warning";
    case "blocked":
    case "maintenance":
      return "text-danger border-danger";
    default:
      return "text-muted border-border";
  }
}

export function SiteMap({
  nodes,
  edges,
  movingVehicles,
  gates,
  selectedGateId,
  onSelectGate,
}: {
  nodes: SiteMapNode[];
  edges: SiteMapEdge[];
  movingVehicles: MovingVehicle[];
  gates: GateInfo[];
  selectedGateId: string;
  onSelectGate: (id: string) => void;
}) {
  const reduce = useReducedMotion();

  const nodeById = (id: string): SiteMapNode | undefined => nodes.find((n) => n.id === id);
  const gateById = (id: string | undefined) => (id ? gates.find((g) => g.id === id) : undefined);

  return (
    <Card className="p-4">
      <svg viewBox="0 0 400 320" className="w-full h-auto" role="img" aria-label="Site digital twin map">
        {edges.map((edge, i) => {
          const from = nodeById(edge.from);
          const to = nodeById(edge.to);
          if (!from || !to) return null;
          return (
            <line
              key={`e-${i}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="currentColor"
              className="text-border"
              strokeWidth={1.5}
            />
          );
        })}

        {nodes.map((node) => {
          const gate = gateById(node.gateId);
          const isGate = node.type === "gate" && !!node.gateId;
          const selected = !!node.gateId && node.gateId === selectedGateId;
          const cls = isGate ? gateClasses(gate?.status ?? "closed") : "text-muted border-border";
          const r = isGate ? (selected ? 11 : 8) : 6;

          const busy = gate ? gate.queue > 2 : false;

          return (
            <g
              key={node.id}
              className={isGate && node.gateId ? "cursor-pointer" : ""}
              onClick={isGate && node.gateId ? () => onSelectGate(node.gateId as string) : undefined}
            >
              {busy && isGate ? (
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  className="text-danger"
                  fill="currentColor"
                  initial={reduce ? undefined : { opacity: 0.35, r: r }}
                  animate={reduce ? undefined : { opacity: 0, r: r + 14 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              ) : null}
              {isGate ? (
                <rect
                  x={node.x - r}
                  y={node.y - r}
                  width={r * 2}
                  height={r * 2}
                  rx={3}
                  className={`fill-background ${cls}`}
                  stroke="currentColor"
                  strokeWidth={selected ? 3 : 2}
                />
              ) : (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  className={`fill-background ${cls}`}
                  stroke="currentColor"
                  strokeWidth={selected ? 3 : 2}
                />
              )}
              <text
                x={node.x}
                y={node.y + r + 12}
                textAnchor="middle"
                className="fill-current text-[8px] text-muted"
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {movingVehicles.map((v) => {
          const from = nodeById(v.fromNode);
          const to = nodeById(v.toNode);
          if (!from || !to) return null;
          const x = from.x + (to.x - from.x) * v.progress;
          const y = from.y + (to.y - from.y) * v.progress;
          const color = v.status === "granted" ? "text-success" : "text-warning";
          return (
            <motion.circle
              key={v.id}
              cx={x}
              cy={y}
              r={4}
              className={color}
              fill="currentColor"
              initial={reduce ? undefined : { scale: 0.6 }}
              animate={reduce ? undefined : { scale: 1 }}
            />
          );
        })}
      </svg>
    </Card>
  );
}
