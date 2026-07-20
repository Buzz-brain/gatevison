export interface ApiBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface ApiDetectionResult {
  vehicle: ApiBoundingBox | null;
  plate: ApiBoundingBox | null;
  face: ApiBoundingBox | null;
}

export interface ApiCroppedResult {
  label: string;
  confidence: number;
  resolution: string;
  image_url?: string;
}

export interface ApiOCRData {
  raw_text: string;
  cleaned_text: string;
  confidence: number;
  is_valid: boolean;
  format: string;
  validated_at: string;
  regex_pattern?: string;
}

export interface ApiFaceData {
  detected: boolean;
  matched_driver_id?: string;
  matched_driver_name?: string;
  similarity: number;
  embedding_distance: number;
  recognition_time_ms: number;
  reference_image_url?: string;
  captured_image_url?: string;
}

export interface ApiVehicleFingerprint {
  detected_model: string;
  similarity: number;
  reference_vehicle: string;
  reference_vehicle_id?: string;
  features: string[];
  embedding_score: number;
  matched: boolean;
}

export interface ApiDecisionData {
  decision: "granted" | "denied" | "manual_review";
  confidence: number;
  reason: string;
  explanation: string;
  recommended_action: string;
  evidence_summary: string;
  rules_triggered: string[];
}

export interface ApiExplainableAIFactor {
  name: string;
  confidence: number;
  passed: boolean;
  weight: number;
}

export interface ApiExplainableAI {
  factors: ApiExplainableAIFactor[];
  final_score: number;
  fusion_method: string;
}

export interface ApiEvidenceItem {
  id: string;
  type: "vehicle" | "plate" | "face" | "identity" | "policy";
  label: string;
  confidence: number;
  detail: string;
}

export interface ApiPipelineStage {
  stage: string;
  status: "inactive" | "processing" | "completed" | "failed" | "manual_review";
  progress: number;
  label: string;
  detail?: string;
  confidence?: number;
  duration_ms: number;
  started_at: string;
  completed_at: string | null;
}

export interface ApiIdentityVerification {
  verified: boolean;
  confidence: number;
  matched_person_id?: string;
  matched_person_name?: string;
  verification_method: string;
}

export interface ApiGateWorkflow {
  gate_action: "open" | "closed" | "pending" | "overridden";
  session_id?: string;
  timestamp: string;
  gate_id?: string;
}

export interface ApiTimestamps {
  image_captured: string;
  vehicle_detected: string;
  plate_localized: string;
  ocr_completed: string;
  face_matched: string;
  vehicle_fingerprint: string;
  identity_confirmed: string;
  decision_generated: string;
  gate_session_created: string;
}

export interface ApiPipelineResult {
  id: string;
  status: "processing" | "completed" | "failed" | "manual_review";
  image_url: string;
  cropped_vehicle: ApiCroppedResult | null;
  cropped_plate: ApiCroppedResult | null;
  cropped_face: ApiCroppedResult | null;
  plate_detection: ApiDetectionResult | null;
  ocr: ApiOCRData | null;
  face: ApiFaceData | null;
  vehicle: ApiVehicleFingerprint | null;
  identity: ApiIdentityVerification | null;
  decision: ApiDecisionData | null;
  explainable_ai: ApiExplainableAI | null;
  evidence: ApiEvidenceItem[];
  pipeline_stages: ApiPipelineStage[];
  gate: ApiGateWorkflow | null;
  timestamps: ApiTimestamps | null;
  total_processing_time_ms: number;
  created_at: string;
}

export interface ApiCameraStatus {
  active: boolean;
  device_id: string | null;
  resolution: string;
  fps: number;
  started_at: string | null;
  error?: string;
}

export interface ApiPipelineStatus {
  pipeline_id: string;
  status: "processing" | "completed" | "failed" | "manual_review";
  current_stage: string;
  progress: number;
  stages: ApiPipelineStage[];
}

export interface ApiPipelineMetrics {
  total_processed: number;
  average_processing_time_ms: number;
  success_rate: number;
  stage_metrics: Array<{
    stage: string;
    average_time_ms: number;
    success_rate: number;
    total_runs: number;
  }>;
  model_metrics: Array<{
    model: string;
    version: string;
    status: "healthy" | "degraded" | "offline";
    latency_ms: number;
    gpu: string;
  }>;
}

export interface ApiRecognitionHistoryEntry {
  id: string;
  plate: string;
  driver: string;
  vehicle: string;
  decision: "granted" | "denied" | "manual_review";
  confidence: number;
  timestamp: string;
  pipeline_id: string;
}

export interface ApiRecognitionHistory {
  items: ApiRecognitionHistoryEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiModelStatus {
  name: string;
  version: string;
  status: "healthy" | "degraded" | "offline";
  latency_ms: number;
  gpu: string;
}
