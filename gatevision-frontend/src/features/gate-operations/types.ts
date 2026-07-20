// Gate Operations domain types (maps to WorkflowService / EntryService / SessionService / DecisionEngine)

export type GateStatus = "open" | "closed" | "processing" | "blocked" | "maintenance";
export type GateMode = "normal" | "vip" | "visitor" | "emergency";

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
  mode: GateMode;
  queue: number;
  officer: string;
  currentPlate?: string;
  throughput: number;
  health: GateHealth;
  map: { x: number; y: number };
}

export interface CameraFeed {
  id: string;
  gateId: string;
  label: string;
  status: "live" | "offline";
  fps: number;
  recording: boolean;
  aiActive: boolean;
  currentPlate?: string;
  vehicleWaiting: boolean;
}

export type RecognitionStatus =
  | "pending"
  | "recognizing"
  | "recognized"
  | "manual_review"
  | "denied";

export interface QueueVehicle {
  id: string;
  plate: string;
  driver: string;
  eta: number;
  recognitionStatus: RecognitionStatus;
  confidence: number;
  position: number;
  make: string;
  model: string;
  purpose: string;
}

export type DecisionKey =
  | "recognition"
  | "decision"
  | "barrier_opening"
  | "vehicle_passing"
  | "session_created";

export type DecisionResult = "granted" | "denied" | "manual_review";

export interface DecisionFlow {
  plate: string;
  driver: string;
  confidence: number;
  result: DecisionResult;
  activeStage: DecisionKey | null;
}

export type BarrierState = "closed" | "raising" | "open" | "lowering";

export interface ManualReviewItem {
  id: string;
  plate: string;
  driver: string;
  confidence: number;
  referenceLabel: string;
  liveLabel: string;
  differences: string[];
  status: "pending" | "approved" | "rejected";
  notes: string;
}

export type EmergencyAction =
  | "force_open"
  | "lock_gate"
  | "fire_mode"
  | "maintenance"
  | "emergency_vehicle";

export interface SessionInside {
  id: string;
  plate: string;
  entryTime: string;
  gate: string;
  expectedExit?: string;
  status: "parked" | "moving" | "exiting";
  durationMs: number;
}

export type ActivityKind =
  | "detected"
  | "recognized"
  | "decision"
  | "opened"
  | "entered"
  | "exited"
  | "alert";

export interface GateActivityEvent {
  id: string;
  time: string;
  timestamp: string;
  label: string;
  gate?: string;
  kind: ActivityKind;
}

export type SiteMapNodeType = "entrance" | "gate" | "parking" | "exit" | "zone";

export interface SiteMapNode {
  id: string;
  type: SiteMapNodeType;
  label: string;
  x: number;
  y: number;
  gateId?: string;
}

export interface SiteMapEdge {
  from: string;
  to: string;
}

export interface MovingVehicle {
  id: string;
  plate: string;
  fromNode: string;
  toNode: string;
  progress: number;
  status: "granted" | "pending";
  gateId?: string;
}

export interface ReplayFrame {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
}

// Backend-mapped types for API integration
export type SessionStatus = "active" | "completed" | "pending_exit";
export type TransactionType = "entry" | "exit";
export type TransactionDecision = "granted" | "denied" | "manual_review";
export type MovementType = "entry" | "exit";

export interface GateSession {
  id: string;
  plate: string;
  driver?: string;
  vehicle?: string;
  gate: string;
  entryTime: string;
  exitTime?: string;
  status: SessionStatus;
  durationMs: number;
}

export interface GateTransaction {
  id: string;
  gateId: string;
  gateName: string;
  plate: string;
  driver?: string;
  vehicle?: string;
  type: TransactionType;
  decision: TransactionDecision;
  confidence?: number;
  timestamp: string;
  processingMs: number;
  barrierState: string;
}

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

export interface MovementHistory {
  id: string;
  plate: string;
  driver?: string;
  vehicle?: string;
  type: MovementType;
  gate: string;
  decision: TransactionDecision;
  timestamp: string;
  confidence?: number;
  processingMs: number;
}

export interface AlertEvent {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  timestamp: string;
  source: string;
}

export interface TrafficPlaybackEvent {
  id: string;
  plate: string;
  type: TransactionType;
  decision: TransactionDecision;
  gate: string;
  timestamp: string;
  confidence?: number;
  driver?: string;
  vehicle?: string;
}

export interface PlaybackState {
  events: TrafficPlaybackEvent[];
  currentIndex: number;
  playing: boolean;
  speed: number;
  startTime: string;
  endTime: string;
}
