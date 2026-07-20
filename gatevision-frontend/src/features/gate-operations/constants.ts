import type { SiteMapNode, SiteMapEdge } from "./types";

export const SITE_MAP_NODES: SiteMapNode[] = [
  { id: "entrance", type: "entrance", label: "Entrance", x: 30, y: 150 },
  { id: "n-gate", type: "gate", label: "North Gate", x: 130, y: 70, gateId: "gate-north" },
  { id: "s-gate", type: "gate", label: "South Gate", x: 130, y: 230, gateId: "gate-south" },
  { id: "v-gate", type: "gate", label: "Visitor Gate", x: 30, y: 150, gateId: "gate-visitor" },
  { id: "vip-gate", type: "gate", label: "VIP Gate", x: 250, y: 150, gateId: "gate-vip" },
  { id: "parking-a", type: "parking", label: "Parking A", x: 250, y: 60 },
  { id: "parking-b", type: "parking", label: "Parking B", x: 250, y: 240 },
  { id: "zone-1", type: "zone", label: "Loading Bay", x: 360, y: 150 },
  { id: "exit", type: "exit", label: "Exit", x: 360, y: 270 },
];

export const SITE_MAP_EDGES: SiteMapEdge[] = [
  { from: "entrance", to: "v-gate" },
  { from: "entrance", to: "n-gate" },
  { from: "entrance", to: "s-gate" },
  { from: "n-gate", to: "parking-a" },
  { from: "s-gate", to: "parking-b" },
  { from: "v-gate", to: "vip-gate" },
  { from: "parking-a", to: "zone-1" },
  { from: "parking-b", to: "exit" },
  { from: "zone-1", to: "exit" },
];
