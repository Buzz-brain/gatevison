import { useState, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Wifi,
  Server,
  Database,
  BrainCircuit,
  ScanText,
  UserCheck,
  Network,
  Zap,
  Monitor,
  Box,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { TopologyData, TopologyNode, TopologyEdge, HealthStatus } from "../types";

interface TopologyMapProps {
  topology: TopologyData;
}

const STATUS_COLOR: Record<HealthStatus, string> = {
  healthy: "#22c55e",
  degraded: "#f59e0b",
  unhealthy: "#ef4444",
  down: "#6b7280",
};

const NODE_ICONS: Record<string, typeof Server> = {
  user: Users,
  gateway: Wifi,
  service: Server,
  database: Database,
  model: BrainCircuit,
  controller: Monitor,
};

const TYPE_ICONS: Record<string, typeof Server> = {
  yolo: BrainCircuit,
  easyocr: ScanText,
  insightface: UserCheck,
  resnet50: Network,
  decision: Zap,
};

const STATUS_TO_PILL: Record<HealthStatus, "healthy" | "degraded" | "unhealthy" | "inactive"> = {
  healthy: "healthy",
  degraded: "degraded",
  unhealthy: "unhealthy",
  down: "inactive",
};

interface LayoutNode {
  node: TopologyNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

function computeLayout(data: TopologyData): { nodes: LayoutNode[]; edges: (TopologyEdge & { sx: number; sy: number; tx: number; ty: number })[] } {
  const nodeW = 160;
  const nodeH = 64;
  const childW = 130;
  const childH = 48;
  const colGap = 80;
  const rowGap = 28;

  const nodeMap = new Map<string, TopologyNode>();
  for (const n of data.nodes) nodeMap.set(n.id, n);

  const childrenOf = new Map<string, TopologyNode[]>();
  const rootNodes: TopologyNode[] = [];
  for (const n of data.nodes) {
    if (n.children && n.children.length > 0) {
      childrenOf.set(n.id, n.children);
      rootNodes.push(n);
    } else if (!data.edges.some((e) => e.target === n.id)) {
      rootNodes.push(n);
    }
  }

  const parentIds = new Set(childrenOf.keys());
  const assigned = new Set<string>();
  const layers: TopologyNode[][] = [];

  const users = rootNodes.filter((n) => n.type === "user");
  const gateways = rootNodes.filter((n) => n.type === "gateway");
  const services = rootNodes.filter((n) => n.type === "service" && !parentIds.has(n.id));
  const other = rootNodes.filter(
    (n) => n.type !== "user" && n.type !== "gateway" && n.type !== "service"
  );

  if (users.length > 0) { layers.push(users); users.forEach((n) => assigned.add(n.id)); }
  if (gateways.length > 0) { layers.push(gateways); gateways.forEach((n) => assigned.add(n.id)); }
  if (services.length > 0) { layers.push(services); services.forEach((n) => assigned.add(n.id)); }

  for (const [parentId, children] of childrenOf) {
    layers.push([nodeMap.get(parentId)!]);
    assigned.add(parentId);
    for (const c of children) {
      layers.push([c]);
      assigned.add(c.id);
    }
  }

  for (const n of other) {
    if (!assigned.has(n.id)) {
      layers.push([n]);
      assigned.add(n.id);
    }
  }

  const nodePositions = new Map<string, LayoutNode>();

  const maxPerLayer = Math.max(...layers.map((l) => l.length), 1);
  const totalWidth = layers.length * nodeW + (layers.length - 1) * colGap;
  const startX = 40;
  const startY = 30;

  let yOffset = startY;
  let maxHeightInRow = 0;

  for (let col = 0; col < layers.length; col++) {
    const layer = layers[col]!;
    const x = startX + col * (nodeW + colGap);

    let localY = yOffset;
    for (const node of layer) {
      const isParent = childrenOf.has(node.id);
      const children = childrenOf.get(node.id);
      const childCount = children?.length ?? 0;

      let w = nodeW;
      let h = nodeH;

      if (isParent && childCount > 0) {
        const subHeight = childCount * childH + (childCount - 1) * rowGap;
        h = Math.max(nodeH, subHeight + 20);
        w = nodeW + childW + 30;
      }

      nodePositions.set(node.id, { node, x, y: localY, width: w, height: h });
      maxHeightInRow = Math.max(maxHeightInRow, h);
      localY += h + rowGap;
    }

    yOffset = startY;
    if (col < layers.length - 1) {
      const nextLayerNodes = layers[col + 1] ?? [];
      let nextTotalH = 0;
      for (const n of nextLayerNodes) {
        const c = childrenOf.get(n.id);
        const cc = c?.length ?? 0;
        let nh = nodeH;
        if (c && cc > 0) {
          nh = Math.max(nodeH, cc * childH + (cc - 1) * rowGap + 20);
        }
        nextTotalH += nh + rowGap;
      }
      if (nextTotalH > 0) yOffset = startY + Math.max(0, (maxHeightInRow - nextTotalH) / 2);
    }
  }

  const layoutEdges = data.edges.map((edge) => {
    const sn = nodePositions.get(edge.source);
    const tn = nodePositions.get(edge.target);
    if (!sn || !tn) return null;
    return {
      ...edge,
      sx: sn.x + sn.width,
      sy: sn.y + sn.height / 2,
      tx: tn.x,
      ty: tn.y + tn.height / 2,
    };
  }).filter(Boolean) as (TopologyEdge & { sx: number; sy: number; tx: number; ty: number })[];

  return { nodes: Array.from(nodePositions.values()), edges: layoutEdges };
}

function NodeRect({
  ln,
  isSelected,
  onClick,
  reduced,
}: {
  ln: LayoutNode;
  isSelected: boolean;
  onClick: () => void;
  reduced: boolean;
}) {
  const { node, x, y, width, height } = ln;
  const color = STATUS_COLOR[node.status];
  const isParent = (node.children?.length ?? 0) > 0;
  const children = node.children ?? [];

  return (
    <g>
      {isParent && (
        <rect
          x={x - 6}
          y={y - 6}
          width={width + 12}
          height={height + 12}
          rx={14}
          fill="rgba(255,255,255,0.02)"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.4}
        />
      )}

      <rect
        x={x}
        y={y}
        width={isParent ? 160 : width}
        height={isParent ? 64 : height}
        rx={10}
        fill="#0f1117"
        stroke={isSelected ? "#3b82f6" : color}
        strokeWidth={isSelected ? 2 : 1.5}
        className="cursor-pointer transition-all"
        style={{
          filter: node.status === "healthy"
            ? `drop-shadow(0 0 4px ${color}40)`
            : undefined,
        }}
        onClick={onClick}
      />

      {node.status === "healthy" && !reduced && (
        <rect
          x={x}
          y={y}
          width={isParent ? 160 : width}
          height={isParent ? 64 : height}
          rx={10}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.3}
        >
          <animate
            attributeName="opacity"
            values="0.3;0.1;0.3"
            dur="3s"
            repeatCount="indefinite"
          />
        </rect>
      )}

      <text
        x={x + (isParent ? 30 : width / 2)}
        y={y + (isParent ? 28 : height / 2 - 6)}
        textAnchor="middle"
        className="fill-foreground text-[11px] font-semibold pointer-events-none"
      >
        {node.label}
      </text>
      <text
        x={x + (isParent ? 30 : width / 2)}
        y={y + (isParent ? 44 : height / 2 + 10)}
        textAnchor="middle"
        className="fill-muted-foreground text-[9px] pointer-events-none"
      >
        {node.latency}ms | {node.throughput}/s
      </text>

      {children.map((child, ci) => {
        const cx = x + 170 + ci * (130 + 20);
        const cy = y + (height - 48) / 2;
        const cc = STATUS_COLOR[child.status];
        const ChildIcon = TYPE_ICONS[child.id] ?? Box;

        return (
          <g key={child.id}>
            <rect
              x={cx}
              y={cy}
              width={130}
              height={48}
              rx={8}
              fill="#0f1117"
              stroke={cc}
              strokeWidth={1}
              style={{
                filter: child.status === "healthy"
                  ? `drop-shadow(0 0 3px ${cc}30)`
                  : undefined,
              }}
            />
            <text
              x={cx + 65}
              y={cy + 20}
              textAnchor="middle"
              className="fill-foreground text-[10px] font-medium pointer-events-none"
            >
              {child.label}
            </text>
            <text
              x={cx + 65}
              y={cy + 36}
              textAnchor="middle"
              className="fill-muted-foreground text-[8px] pointer-events-none"
            >
              {child.latency}ms
            </text>
          </g>
        );
      })}
    </g>
  );
}

function AnimatedEdge({
  edge,
  reduced,
}: {
  edge: TopologyEdge & { sx: number; sy: number; tx: number; ty: number };
  reduced: boolean;
}) {
  const color = STATUS_COLOR[edge.status] ?? "#6b7280";
  const mx = (edge.sx + edge.tx) / 2;

  return (
    <g>
      <path
        d={`M ${edge.sx} ${edge.sy} C ${mx} ${edge.sy}, ${mx} ${edge.ty}, ${edge.tx} ${edge.ty}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.4}
      />
      {!reduced && (
        <>
          <circle r={3} fill={color} opacity={0.9}>
            <animateMotion
              dur={`${1.5 + Math.random()}s`}
              repeatCount="indefinite"
              path={`M ${edge.sx} ${edge.sy} C ${mx} ${edge.sy}, ${mx} ${edge.ty}, ${edge.tx} ${edge.ty}`}
            />
          </circle>
          <circle r={2} fill={color} opacity={0.5}>
            <animateMotion
              dur={`${2 + Math.random()}s`}
              repeatCount="indefinite"
              begin="0.5s"
              path={`M ${edge.sx} ${edge.sy} C ${mx} ${edge.sy}, ${mx} ${edge.ty}, ${edge.tx} ${edge.ty}`}
            />
          </circle>
        </>
      )}
    </g>
  );
}

function DetailPanel({
  node,
  onClose,
  reduced,
}: {
  node: TopologyNode;
  onClose: () => void;
  reduced: boolean;
}) {
  const Icon = NODE_ICONS[node.type] ?? Server;
  const color = STATUS_COLOR[node.status];

  return (
    <motion.div
      initial={reduced ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reduced ? { opacity: 0, x: 10 } : { opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-4 right-4 w-64 z-10"
    >
      <Card className="p-4 shadow-2xl border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color }} />
            <span className="text-sm font-semibold">{node.label}</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            x
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium capitalize">{node.type}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <StatusPill
              status={STATUS_TO_PILL[node.status]}
              label={node.status.charAt(0).toUpperCase() + node.status.slice(1)}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Latency</span>
            <span className="font-mono font-medium">{node.latency}ms</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Throughput</span>
            <span className="font-mono font-medium">{node.throughput}/s</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Requests</span>
            <span className="font-mono font-medium">{node.requests.toLocaleString()}</span>
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Children</p>
            <div className="space-y-1">
              {node.children.map((child) => (
                <div key={child.id} className="flex items-center justify-between text-xs">
                  <span>{child.label}</span>
                  <span className="font-mono text-muted-foreground">{child.latency}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export function TopologyMap({ topology }: TopologyMapProps) {
  const reduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const layout = useMemo(() => computeLayout(topology), [topology]);

  const svgWidth = useMemo(() => {
    if (layout.nodes.length === 0) return 800;
    const maxX = Math.max(...layout.nodes.map((n) => n.x + n.width + 200));
    return Math.max(maxX, 800);
  }, [layout]);

  const svgHeight = useMemo(() => {
    if (layout.nodes.length === 0) return 500;
    const maxY = Math.max(...layout.nodes.map((n) => n.y + n.height));
    return Math.max(maxY + 60, 400);
  }, [layout]);

  const selectedNode = useMemo(() => {
    if (!selectedId) return null;
    return topology.nodes.find((n) => n.id === selectedId) ?? null;
  }, [selectedId, topology.nodes]);

  const handleNodeClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Digital Twin Infrastructure Map</h3>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-success" /> Healthy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-warning" /> Degraded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger" /> Down
          </span>
        </div>
      </div>

      <Card className="p-0 overflow-hidden relative">
        <AnimatePresence>
          {selectedNode && (
            <DetailPanel
              node={selectedNode}
              onClose={() => setSelectedId(null)}
              reduced={reduced}
            />
          )}
        </AnimatePresence>

        <div className="overflow-x-auto overflow-y-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="min-w-[800px]"
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {layout.edges.map((edge, i) => (
              <AnimatedEdge
                key={`${edge.source}-${edge.target}-${i}`}
                edge={edge}
                reduced={reduced}
              />
            ))}

            {layout.edges.map((edge, i) => {
              const labelX = (edge.sx + edge.tx) / 2;
              const labelY = Math.min(edge.sy, edge.ty) - 8;
              return (
                <text
                  key={`label-${i}`}
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px]"
                >
                  {edge.latency}ms
                </text>
              );
            })}

            {layout.nodes.map((ln) => (
              <NodeRect
                key={ln.node.id}
                ln={ln}
                isSelected={selectedId === ln.node.id}
                onClick={() => handleNodeClick(ln.node.id)}
                reduced={reduced}
              />
            ))}
          </svg>
        </div>
      </Card>
    </div>
  );
}
