export type ScenarioId =
  | "authorized_staff"
  | "unauthorized_visitor"
  | "vehicle_mismatch"
  | "face_mismatch"
  | "expired_permit"
  | "emergency_override"
  | "manual_review"
  | "vip_entry"
  | "stolen_vehicle"
  | "tailgating_attempt";

export type DemoView = "scenarios" | "auto" | "presentation" | "judge" | "metrics" | "story" | "playback";

export interface Scenario {
  id: ScenarioId;
  title: string;
  subtitle: string;
  description: string;
  outcome: "granted" | "denied" | "review" | "override";
  severity: "safe" | "warning" | "critical";
  icon: string;
  duration: number;
  steps: ScenarioStep[];
  evidence: EvidenceItem[];
  reasoning: ReasoningStep[];
}

export interface ScenarioStep {
  id: string;
  label: string;
  narration: string;
  duration: number;
  confidence?: number;
  status: "pending" | "running" | "success" | "fail" | "warning" | "critical";
}

export interface EvidenceItem {
  type: "camera" | "plate" | "face" | "vehicle" | "identity" | "policy";
  label: string;
  value: string;
  confidence: number;
  status: "match" | "mismatch" | "not_found" | "expired";
}

export interface ReasoningStep {
  step: string;
  detail: string;
  result: string;
  passed: boolean;
}

export interface MetricsSnapshot {
  entries: number;
  exits: number;
  denied: number;
  manualReviews: number;
  incidents: number;
  avgProcessingTime: number;
  throughput: number;
  timestamp: string;
}

export interface PlaybackFrame {
  id: string;
  timestamp: string;
  camera: string;
  label: string;
  confidence: number;
  imageUrl: string;
  type: "capture" | "plate" | "face" | "vehicle" | "decision" | "gate";
}

export interface DemoState {
  activeView: DemoView;
  selectedScenario: ScenarioId | null;
  isAutoRunning: boolean;
  autoProgress: number;
  judgeMode: boolean;
  metrics: MetricsSnapshot[];
  playbackFrames: PlaybackFrame[];
  playbackPosition: number;
  isPlaying: boolean;
  playbackSpeed: number;
}
