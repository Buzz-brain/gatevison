// Backend-mirror types for Gate Operations

export interface ApiEntryRequest {
  plate: string;
  gate_id: string;
  driver?: string;
  vehicle?: string;
  confidence?: number;
}

export interface ApiExitRequest {
  plate: string;
  gate_id: string;
}

export interface ApiWorkflowResult {
  success: boolean;
  message: string;
  decision: "granted" | "denied" | "manual_review";
  session_id?: string;
  plate: string;
  processing_ms: number;
  barrier_state: "closed" | "raising" | "open" | "lowering";
  requires_review?: boolean;
  reason?: string;
}

export interface ApiGateActive {
  gates: ApiGateInfo[];
  total_vehicles_inside: number;
}

export interface ApiGateInfo {
  id: string;
  name: string;
  status: string;
  barrier: string;
  sensor_state: string;
  current_vehicle?: string;
  operator: string;
  connection: string;
  last_activity: string;
  entries_today: number;
  exits_today: number;
  vehicles_inside: number;
}

export interface ApiGateStatistics {
  total_gates: number;
  gates: ApiGateInfo[];
  total_vehicles_inside: number;
  total_entries_today: number;
  total_exits_today: number;
  avg_session_duration_ms: number;
}

export interface ApiGateSession {
  id: string;
  plate: string;
  driver?: string;
  vehicle?: string;
  gate: string;
  entry_time: string;
  exit_time?: string;
  status: "active" | "completed" | "pending_exit";
  duration_ms: number;
}

export interface ApiGateTransaction {
  id: string;
  gate_id: string;
  gate_name: string;
  plate: string;
  driver?: string;
  vehicle?: string;
  type: "entry" | "exit";
  decision: "granted" | "denied" | "manual_review";
  confidence?: number;
  timestamp: string;
  processing_ms: number;
  barrier_state: string;
}

export interface ApiVehicleMovement {
  id: string;
  plate: string;
  driver?: string;
  vehicle?: string;
  type: "entry" | "exit";
  gate: string;
  decision: "granted" | "denied" | "manual_review";
  timestamp: string;
  confidence?: number;
  processing_ms: number;
}

export interface ApiMovementHistory {
  plate: string;
  driver?: string;
  vehicle?: string;
  movements: ApiVehicleMovement[];
}

export interface ApiSessionState {
  session: ApiGateSession;
  movements: ApiVehicleMovement[];
}

export interface ApiActiveVehicle {
  id: string;
  plate: string;
  driver?: string;
  vehicle?: string;
  gate: string;
  entry_time: string;
  duration_ms: number;
  status: "parked" | "moving" | "exiting";
}
