// Gate Operations domain types (maps to WorkflowService / EntryService / SessionService / DecisionEngine)

export type GateStatus = "open" | "closed" | "processing" | "blocked" | "maintenance";

export type HealthState = "healthy" | "degraded" | "offline";

export interface GateHealth {
  camera: HealthState;
  barrier: HealthState;
  network: HealthState;
  ai: HealthState;
  rfid: HealthState;
  power: HealthState;
}

export interface GateInfo {
  id: string;
  name: string;
  status: GateStatus;
  health: GateHealth;
}

export type DecisionKey =
  | "recognition"
  | "decision"
  | "barrier_opening"
  | "vehicle_passing"
  | "session_created"
  | "session_matching"
  | "verification"
  | "session_closed";

export type DecisionResult = "granted" | "denied" | "manual_review";

export interface DecisionFlow {
  plate: string;
  driver: string;
  confidence: number;
  result: DecisionResult;
  activeStage: DecisionKey | null;
  mode: "entry" | "exit";
}

export interface SessionInside {
  id: string;
  plate: string;
  entryTime: string;
  gate: string;
  expectedExit?: string;
  status: "parked" | "moving" | "exiting";
  durationMs: number;
}

// Backend-mapped types for API integration
export interface ActiveVehicle {
  id: string;
  plate: string;
  driver?: string;
  vehicle?: string;
  gate: string;
  entryTime: string;
  durationMs: number;
  status: "parked" | "moving" | "exiting";
}
