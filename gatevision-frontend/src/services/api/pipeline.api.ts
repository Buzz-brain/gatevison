import { post, get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import { api } from "@/lib/api/axios";
import type {
  ApiPipelineResult, ApiPipelineStatus, ApiPipelineMetrics, ApiPipelineStage,
} from "@/features/recognition/types/api";
import type { NormalizedError } from "@/types/api";

interface RawStageResult {
  stage_name: string;
  success: boolean;
  duration_ms: number;
  error?: string | null;
}

interface RawRecognizedPlate {
  plate: string;
  confidence: number;
  validation_status: string;
}

interface RawFaceRecognition {
  face_detected: boolean;
  face_count: number;
  similarity_score?: number | null;
  matched?: boolean;
  matched_driver_id?: string | null;
  matched_driver_name?: string | null;
  embedding_distance?: number | null;
}

interface RawVehicleFingerprint {
  dimension: number;
  duration_ms: number;
  plate_text?: string | null;
}

interface RawPipelineData {
  request_id: string;
  plates_detected: number;
  plates_recognized: number;
  recognized_plates?: RawRecognizedPlate[];
  faces_detected: number;
  face_recognitions?: RawFaceRecognition[];
  vehicle_fingerprints?: RawVehicleFingerprint[];
  processing_time_ms: number;
  stage_results?: RawStageResult[];
  warnings: string[];
  errors: string[];
  decision?: Record<string, unknown>;
  gate_workflow_result?: Record<string, unknown>;
}

const STAGE_ORDER: Array<{ key: string; backend: string; label: string }> = [
  { key: "vehicle_detection", backend: "_capture_frame", label: "Vehicle Detection" },
  { key: "plate_detection", backend: "_detect_plates", label: "Plate Detection" },
  { key: "ocr", backend: "_recognize_plates", label: "OCR" },
  { key: "face_recognition", backend: "_recognize_faces", label: "Face Recognition" },
  { key: "vehicle_fingerprint", backend: "_process_vehicle_fingerprint", label: "Vehicle Fingerprint" },
  { key: "identity_verification", backend: "_process_gate_workflow", label: "Identity Verification" },
  { key: "decision", backend: "_evaluate_decision", label: "Decision Engine" },
];

function mapDecision(raw: Record<string, unknown> | undefined): ApiPipelineResult["decision"] {
  const decisionValue = String(raw?.decision ?? "MANUAL_REVIEW");
  const confidence = Number(raw?.overall_confidence ?? 0);
  const explanation = String(raw?.explanation ?? "");
  const decision = decisionValue === "GRANT" ? "granted"
    : decisionValue === "DENY" ? "denied"
    : "manual_review";
  return {
    decision,
    confidence,
    reason: explanation,
    explanation,
    recommended_action: decision === "granted" ? "Allow vehicle through"
      : decision === "denied" ? "Deny access"
      : "Review manually",
    evidence_summary: "",
    rules_triggered: [],
  };
}

function mapGate(raw: Record<string, unknown> | undefined): ApiPipelineResult["gate"] {
  if (!raw) return null;
  const success = raw.success === true;
  const action = String(raw.action ?? "");
  const session = raw.session as Record<string, unknown> | undefined;
  const transaction = raw.transaction as Record<string, unknown> | undefined;
  return {
    gate_action: success ? "open" : action === "DENY" || action === "EXIT_DENIED" ? "closed" : "pending",
    session_id: (session?.session_id as string) ?? (session?.id as string) ?? undefined,
    transaction_id: (transaction?.transaction_id as string) ?? (transaction?.id as string) ?? undefined,
    timestamp: new Date().toISOString(),
    gate_id: undefined,
    success,
    action,
    vehicle_id: (raw.vehicle_id as string) ?? undefined,
    message: (raw.message as string) ?? undefined,
    error: (raw.error as string) ?? undefined,
  };
}

function normalizePipelineResult(raw: RawPipelineData, backendSuccess: boolean): ApiPipelineResult {
  const decision = raw.decision ?? {};
  const decisionValue = String(decision.decision ?? "MANUAL_REVIEW");
  const status: ApiPipelineResult["status"] = backendSuccess
    ? decisionValue === "MANUAL_REVIEW" ? "manual_review" : "completed"
    : "failed";

  const createdAt = new Date().toISOString();
  const pipeline_stages: ApiPipelineStage[] = STAGE_ORDER.map((stage) => {
    const sr = (raw.stage_results ?? []).find((s) => s.stage_name === stage.backend);
    if (!sr) {
      return {
        stage: stage.key,
        status: "inactive" as const,
        progress: 0,
        label: stage.label,
        detail: "Not enabled in this pipeline",
        duration_ms: 0,
        started_at: createdAt,
        completed_at: null,
      };
    }
    return {
      stage: stage.key,
      status: sr.success ? ("completed" as const) : ("failed" as const),
      progress: sr.success ? 100 : 0,
      label: stage.label,
      detail: sr.error ?? undefined,
      duration_ms: sr.duration_ms,
      started_at: createdAt,
      completed_at: sr.success ? createdAt : null,
    };
  });

  const plate = raw.recognized_plates?.[0];
  const face = raw.face_recognitions?.[0];
  const fingerprint = raw.vehicle_fingerprints?.[0];

  return {
    id: raw.request_id,
    status,
    image_url: "",
    cropped_vehicle: null,
    cropped_plate: plate ? {
      label: "Plate",
      confidence: plate.confidence,
      resolution: "N/A",
      image_url: undefined,
    } : null,
    cropped_face: null,
    plate_detection: null,
    ocr: plate ? {
      raw_text: plate.plate,
      cleaned_text: plate.plate,
      confidence: plate.confidence,
      is_valid: plate.validation_status === "valid",
      format: "NIGERIA",
      validated_at: "",
    } : null,
    face: face ? {
      detected: face.face_detected,
      similarity: Math.round((face.similarity_score ?? 0) * 100),
      embedding_distance: face.embedding_distance ?? 0,
      recognition_time_ms: 0,
      matched_driver_id: face.matched_driver_id ?? undefined,
      matched_driver_name: face.matched_driver_name ?? undefined,
    } : null,
    vehicle: fingerprint && fingerprint.dimension > 0 ? {
      detected_model: "ResNet50",
      similarity: 0,
      reference_vehicle: fingerprint.plate_text ?? "",
      reference_vehicle_id: undefined,
      features: [],
      embedding_score: fingerprint.dimension,
      matched: false,
    } : null,
    identity: null,
    decision: mapDecision(raw.decision),
    explainable_ai: null,
    evidence: [],
    pipeline_stages,
    gate: mapGate(raw.gate_workflow_result),
    timestamps: null,
    total_processing_time_ms: raw.processing_time_ms,
    created_at: createdAt,
  };
}

export async function processPipelineUploadApi(
  file: File,
  direction: "entry" | "exit" = "entry",
  onProgress?: (pct: number) => void,
  requireFace?: boolean,
  faceFile?: File,
): Promise<ApiPipelineResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (faceFile) formData.append("face_file", faceFile);
    const params: Record<string, string> = { direction };
    if (requireFace !== undefined) params.require_face = String(requireFace);
    const response = await api.post<{ success: boolean; data: RawPipelineData; message: string }>(
      ENDPOINTS.PIPELINE.PROCESS_UPLOAD,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300_000,
        params,
        onUploadProgress: (e) => {
          if (e.total && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      },
    );
    if (response.data.data) return normalizePipelineResult(response.data.data, response.data.success);
    throw { code: "UNKNOWN", message: response.data.message || "Pipeline processing failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function processPipelineCameraApi(
  direction: "entry" | "exit" = "entry",
  requireFace?: boolean,
): Promise<ApiPipelineResult> {
  try {
    const params: Record<string, string> = { direction };
    if (requireFace !== undefined) params.require_face = String(requireFace);
    const response = await api.post<{ success: boolean; data: RawPipelineData; message: string }>(
      ENDPOINTS.PIPELINE.PROCESS_CAMERA,
      undefined,
      { timeout: 300_000, params },
    );
    if (response.data.data) return normalizePipelineResult(response.data.data, response.data.success);
    throw { code: "UNKNOWN", message: response.data.message || "Camera pipeline processing failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getPipelineStatusApi(pipelineId: string): Promise<ApiPipelineStatus> {
  try {
    const response = await get<ApiPipelineStatus>(ENDPOINTS.PIPELINE.STATUS, { pipeline_id: pipelineId });
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to get pipeline status" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getPipelineMetricsApi(): Promise<ApiPipelineMetrics> {
  try {
    const response = await get<ApiPipelineMetrics>(ENDPOINTS.PIPELINE.METRICS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to get pipeline metrics" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
