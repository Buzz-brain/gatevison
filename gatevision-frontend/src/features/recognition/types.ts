export type PipelineStage =
  | "idle"
  | "vehicle_detection"
  | "plate_detection"
  | "ocr"
  | "face_recognition"
  | "vehicle_fingerprint"
  | "identity_verification"
  | "decision";

export type StageStatus = "inactive" | "processing" | "completed" | "failed" | "manual_review";

export interface StageState {
  stage: PipelineStage;
  status: StageStatus;
  progress: number;
  label: string;
  detail?: string;
  confidence?: number;
  duration?: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  color: string;
}

export interface DetectionOverlay {
  vehicle: BoundingBox | null;
  plate: BoundingBox | null;
  face: BoundingBox | null;
}

export interface CroppedResult {
  label: string;
  confidence: number;
  resolution: string;
}

export interface OCRResult {
  raw: string;
  cleaned: string;
  confidence: number;
  isValid: boolean;
  format: string;
  validatedAt: string;
}

export interface FaceMatch {
  detected: boolean;
  matchedDriver?: string;
  similarity: number;
  embeddingDistance: number;
}

export interface VehicleFingerprint {
  detected: string;
  similarity: number;
  referenceVehicle: string;
  features: string[];
  embeddingScore: number;
}

export interface DecisionResult {
  decision: "granted" | "denied" | "manual_review";
  confidence: number;
  reason: string;
  explanation: string;
  recommendedAction: string;
}

export interface GateOutcome {
  success: boolean;
  action: string;
  vehicleId?: string;
  message?: string;
  error?: string;
  sessionId?: string;
  transactionId?: string;
}

export interface ExplainableAIData {
  plateMatch: { confidence: number; passed: boolean };
  driverMatch: { confidence: number; passed: boolean };
  vehicleMatch: { confidence: number; passed: boolean };
  policyCheck: { confidence: number; passed: boolean };
  finalScore: number;
}

export interface EvidenceItem {
  id: string;
  type: "vehicle" | "plate" | "face" | "identity" | "policy";
  label: string;
  confidence: number;
  detail: string;
  expanded?: boolean;
}

export interface RecognitionResult {
  id: string;
  pipelineId: string;
  frameUrl: string;
  croppedVehicle: CroppedResult;
  croppedPlate: CroppedResult;
  croppedFace: CroppedResult;
  ocr: OCRResult;
  face: FaceMatch;
  vehicle: VehicleFingerprint;
  decision: DecisionResult;
  gate: GateOutcome | null;
  explainableAI: ExplainableAIData;
  evidence: EvidenceItem[];
  timestamp: string;
  processingTime: number;
  stages: StageState[];
  boundingBoxes: DetectionOverlay;
}

export interface TimelineEvent {
  time: string;
  label: string;
  stage: PipelineStage;
  status: StageStatus;
  detail?: string;
}

export interface RecognitionHistoryEntry {
  id: string;
  plate: string;
  driver: string;
  vehicle: string;
  decision: "granted" | "denied" | "manual_review";
  confidence: number;
  direction: "entry" | "exit";
  timestamp: string;
  pipelineId: string;
}

export interface PlaybackState {
  isPlaying: boolean;
  isComplete: boolean;
  currentStageIndex: number;
  speed: number;
}
