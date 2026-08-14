import type { GateInfo } from "./types";

export const STATIC_GATES: GateInfo[] = [
  {
    id: "gate-north", name: "North Gate", status: "open",
    health: { camera: "healthy", barrier: "healthy", network: "healthy", ai: "healthy", rfid: "healthy", power: "healthy" },
  },
  {
    id: "gate-south", name: "South Gate", status: "open",
    health: { camera: "healthy", barrier: "healthy", network: "healthy", ai: "healthy", rfid: "healthy", power: "healthy" },
  },
  {
    id: "gate-visitor", name: "Visitor Gate", status: "closed",
    health: { camera: "healthy", barrier: "healthy", network: "healthy", ai: "healthy", rfid: "healthy", power: "healthy" },
  },
  {
    id: "gate-vip", name: "VIP Gate", status: "closed",
    health: { camera: "healthy", barrier: "healthy", network: "healthy", ai: "healthy", rfid: "healthy", power: "healthy" },
  },
  {
    id: "gate-emergency", name: "Emergency Gate", status: "maintenance",
    health: { camera: "degraded", barrier: "healthy", network: "degraded", ai: "healthy", rfid: "healthy", power: "healthy" },
  },
];
