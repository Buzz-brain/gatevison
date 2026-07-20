export interface DashboardMetrics {
  vehiclesProcessed: number;
  entries: number;
  exits: number;
  denied: number;
  manualReviews: number;
  avgProcessingTime: number;
  recognitionAccuracy: number;
  peakHour: string;
}

export interface LiveCameraFeed {
  id: string;
  name: string;
  gate: string;
  status: "online" | "offline" | "degraded";
  fps: number;
  isRecording: boolean;
  lastMotion: string;
}

export interface GateEvent {
  id: string;
  type: GateEventType;
  plate: string;
  driver?: string;
  vehicle?: string;
  gate: string;
  confidence: number;
  timestamp: string;
  decision: "granted" | "denied" | "manual_review";
  details?: string;
}

export type GateEventType =
  | "entry"
  | "exit"
  | "denied"
  | "manual_review"
  | "registered"
  | "system"
  | "warning";

export interface ActivityEvent {
  id: string;
  type: "entry" | "exit" | "denied" | "alert" | "system" | "review" | "warning" | "manual_review";
  message: string;
  timestamp: string;
  plate?: string;
  confidence?: number;
}

export interface Incident {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  timestamp: string;
  category: IncidentCategory;
  actionLabel?: string;
}

export type IncidentCategory =
  | "manual_review"
  | "camera_offline"
  | "low_confidence"
  | "threshold_exceeded"
  | "duplicate"
  | "timeout"
  | "system";

export interface SystemModule {
  id: string;
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency: number;
  lastHeartbeat: string;
  version: string;
}

export interface GateStatus {
  id: string;
  name: string;
  isOpen: boolean;
  barrier: "up" | "down" | "moving";
  sensorState: "clear" | "occupied" | "error";
  currentVehicle?: string;
  operator: string;
  connection: "online" | "offline" | "degraded";
  lastActivity: string;
}

export interface RecentDecision {
  id: string;
  plate: string;
  driver: string;
  vehicle: string;
  decision: "granted" | "denied" | "manual_review";
  confidence: number;
  timestamp: string;
  processingTime: number;
}

export interface DecisionStage {
  stage: string;
  status: "pending" | "active" | "completed" | "failed";
  label: string;
  detail?: string;
  confidence?: number;
  timestamp?: string;
}

export interface MissionReplay {
  id: string;
  plate: string;
  driver: string;
  vehicle: string;
  decision: "granted" | "denied" | "manual_review";
  stages: DecisionStage[];
  startedAt: string;
  completedAt: string;
  totalTime: number;
}

export interface AIStatus {
  detectionAccuracy: number;
  modelsLoaded: number;
  totalModels: number;
  avgDecisionTime: number;
  confidence: number;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface HourlyFlow extends ChartDataPoint {
  hour: string;
  entries: number;
  exits: number;
}
