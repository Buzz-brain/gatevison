import type {
  RecognitionResult, StageState, DetectionOverlay, CroppedResult,
  OCRResult, FaceMatch, VehicleFingerprint, DecisionResult,
  ExplainableAIData, EvidenceItem, TimelineEvent, GateOutcome,
  RecognitionHistoryEntry, BoundingBox, PipelineStage,
} from "../types";
import type {
  ApiPipelineResult, ApiRecognitionHistoryEntry,
  ApiPipelineStage, ApiBoundingBox, ApiDetectionResult,
  ApiCroppedResult, ApiOCRData, ApiFaceData,
  ApiVehicleFingerprint, ApiDecisionData, ApiExplainableAI,
  ApiEvidenceItem, ApiTimestamps, ApiGateWorkflow,
} from "../types/api";

const STAGE_ORDER_MAP: Record<string, PipelineStage> = {
  vehicle_detection: "vehicle_detection",
  plate_detection: "plate_detection",
  ocr: "ocr",
  face_recognition: "face_recognition",
  vehicle_fingerprint: "vehicle_fingerprint",
  identity_verification: "identity_verification",
  decision: "decision",
};

function mapStageStatus(s: string): StageState["status"] {
  if (s === "processing" || s === "completed" || s === "failed" || s === "manual_review") return s;
  return "inactive";
}

function mapBoundingBox(b: ApiBoundingBox | null, color: string): BoundingBox | null {
  if (!b) return null;
  return { x: b.x, y: b.y, width: b.width, height: b.height, label: b.label, confidence: b.confidence, color };
}

function mapDetectionOverlay(d: ApiDetectionResult | null): DetectionOverlay {
  return {
    vehicle: mapBoundingBox(d?.vehicle ?? null, "#3B82F6"),
    plate: mapBoundingBox(d?.plate ?? null, "#22C55E"),
    face: mapBoundingBox(d?.face ?? null, "#F59E0B"),
  };
}

function mapCroppedResult(r: ApiCroppedResult | null, label: string, fallbackConfidence: number): CroppedResult {
  return {
    label,
    confidence: r?.confidence ?? fallbackConfidence,
    resolution: r?.resolution ?? "N/A",
  };
}

function mapOCRData(o: ApiOCRData | null): OCRResult | null {
  if (!o) return null;
  return {
    raw: o.raw_text,
    cleaned: o.cleaned_text,
    confidence: o.confidence,
    isValid: o.is_valid,
    format: o.format,
    validatedAt: o.validated_at,
  };
}

function mapFaceData(f: ApiFaceData | null): FaceMatch | null {
  if (!f) return null;
  return {
    detected: f.detected,
    matchedDriver: f.matched_driver_name ?? f.matched_driver_id,
    similarity: f.similarity,
    embeddingDistance: f.embedding_distance,
  };
}

function mapVehicleData(v: ApiVehicleFingerprint | null): VehicleFingerprint | null {
  if (!v) return null;
  return {
    detected: v.detected_model,
    similarity: v.similarity,
    referenceVehicle: v.reference_vehicle,
    features: v.features,
    embeddingScore: v.embedding_score,
  };
}

function mapDecisionData(d: ApiDecisionData | null): DecisionResult | null {
  if (!d) return null;
  return {
    decision: d.decision,
    confidence: d.confidence,
    reason: d.reason,
    explanation: d.explanation,
    recommendedAction: d.recommended_action,
  };
}

function mapGateOutcome(g: ApiGateWorkflow | null): GateOutcome | null {
  if (!g) return null;
  return {
    success: g.success ?? g.gate_action === "open",
    action: g.action ?? "",
    vehicleId: g.vehicle_id,
    message: g.message,
    error: g.error,
    sessionId: g.session_id,
    transactionId: g.transaction_id,
  };
}

function mapExplainableAI(e: ApiExplainableAI | null): ExplainableAIData {
  return {
    plateMatch: { confidence: e?.factors?.[0]?.confidence ?? 0, passed: e?.factors?.[0]?.passed ?? false },
    driverMatch: { confidence: e?.factors?.[1]?.confidence ?? 0, passed: e?.factors?.[1]?.passed ?? false },
    vehicleMatch: { confidence: e?.factors?.[2]?.confidence ?? 0, passed: e?.factors?.[2]?.passed ?? false },
    policyCheck: { confidence: e?.factors?.[3]?.confidence ?? 0, passed: e?.factors?.[3]?.passed ?? false },
    finalScore: e?.final_score ?? 0,
  };
}

function mapEvidenceItems(items: ApiEvidenceItem[]): EvidenceItem[] {
  return items.map((item) => ({
    id: item.id,
    type: item.type,
    label: item.label,
    confidence: item.confidence,
    detail: item.detail,
  }));
}

function mapPipelineStage(s: ApiPipelineStage): StageState {
  return {
    stage: STAGE_ORDER_MAP[s.stage] ?? "idle",
    status: mapStageStatus(s.status),
    progress: s.progress,
    label: s.label,
    detail: s.detail,
    confidence: s.confidence,
    duration: s.duration_ms,
  };
}

function mapTimestamps(ts: ApiTimestamps | null, stages: StageState[]): TimelineEvent[] {
  if (!ts) {
    const now = new Date();
    const events: TimelineEvent[] = [
      { time: formatTimeFromDate(now), label: "Frame Captured", stage: "idle", status: "completed" },
    ];
    let cursor = now.getTime();
    for (const s of stages) {
      cursor += s.duration ?? 150;
      events.push({
        time: formatTimeFromMs(cursor),
        label: s.label,
        stage: s.stage,
        status: s.status,
        detail: s.detail,
      });
    }
    return events;
  }

  const entries: Array<{ key: keyof ApiTimestamps; label: string; stage: PipelineStage }> = [
    { key: "image_captured", label: "Image Captured", stage: "idle" },
    { key: "vehicle_detected", label: "Vehicle Detected", stage: "vehicle_detection" },
    { key: "plate_localized", label: "Plate Localized", stage: "plate_detection" },
    { key: "ocr_completed", label: "OCR Completed", stage: "ocr" },
    { key: "face_matched", label: "Face Matched", stage: "face_recognition" },
    { key: "vehicle_fingerprint", label: "Vehicle Fingerprint Verified", stage: "vehicle_fingerprint" },
    { key: "identity_confirmed", label: "Identity Confirmed", stage: "identity_verification" },
    { key: "decision_generated", label: "Decision Generated", stage: "decision" },
    { key: "gate_session_created", label: "Gate Session Created", stage: "decision" },
  ];

  return entries.map((entry) => {
    const tsValue = ts[entry.key];
    const matchingStage = stages.find((s) => s.stage === entry.stage);
    return {
      time: tsValue ? formatTimeFromIso(tsValue) : "--:--:--",
      label: entry.label,
      stage: entry.stage,
      status: matchingStage?.status ?? "completed",
      detail: matchingStage?.detail,
    };
  });
}

function formatTimeFromDate(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatTimeFromMs(ms: number): string {
  const d = new Date(ms);
  return formatTimeFromDate(d);
}

function formatTimeFromIso(iso: string): string {
  try {
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${d.getMilliseconds().toString().padStart(3, "0")}`;
  } catch {
    return "--:--:--";
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function findStageConfidence(stages: StageState[], key: string): number | undefined {
  const s = stages.find((st) => st.stage === key);
  return s?.confidence;
}

export function mapPipelineResult(data: ApiPipelineResult): RecognitionResult {
  const stages: StageState[] = (data.pipeline_stages ?? []).map(mapPipelineStage);
  const dt = data.plate_detection ?? { vehicle: null, plate: null, face: null };
  const detectionOverlay = mapDetectionOverlay(
    dt.vehicle || dt.plate || dt.face
      ? { vehicle: dt.vehicle ?? null, plate: dt.plate ?? null, face: dt.face ?? null }
      : null,
  );

  const ocrConfidence = data.ocr?.confidence ?? findStageConfidence(stages, "ocr") ?? 0;
  const faceConfidence = data.face?.similarity ?? findStageConfidence(stages, "face_recognition") ?? 0;
  const vehicleConfidence = data.vehicle?.similarity ?? findStageConfidence(stages, "vehicle_fingerprint") ?? 0;

  return {
    id: data.id,
    pipelineId: data.id,
    frameUrl: data.image_url,
    croppedVehicle: mapCroppedResult(data.cropped_vehicle, "Vehicle", vehicleConfidence),
    croppedPlate: mapCroppedResult(data.cropped_plate, "Plate", ocrConfidence),
    croppedFace: mapCroppedResult(data.cropped_face, "Face", faceConfidence),
    ocr: mapOCRData(data.ocr) ?? {
      raw: "", cleaned: "", confidence: 0, isValid: false, format: "N/A", validatedAt: "",
    },
    face: mapFaceData(data.face) ?? {
      detected: false, matchedDriver: undefined, similarity: 0, embeddingDistance: 0,
    },
    vehicle: mapVehicleData(data.vehicle) ?? {
      detected: "", similarity: 0, referenceVehicle: "", features: [], embeddingScore: 0,
    },
    decision: mapDecisionData(data.decision) ?? {
      decision: "manual_review", confidence: 0, reason: "No decision data",
      explanation: "", recommendedAction: "Review manually",
    },
    gate: mapGateOutcome(data.gate),
    explainableAI: mapExplainableAI(data.explainable_ai),
    evidence: mapEvidenceItems(data.evidence),
    timestamp: data.created_at,
    processingTime: data.total_processing_time_ms,
    stages,
    boundingBoxes: detectionOverlay,
  };
}

export function mapHistoryEntry(entry: ApiRecognitionHistoryEntry): RecognitionHistoryEntry {
  return {
    id: entry.id,
    plate: entry.plate,
    driver: entry.driver,
    vehicle: entry.vehicle,
    decision: entry.decision,
    confidence: entry.confidence,
    direction: entry.direction,
    timestamp: entry.timestamp,
    pipelineId: entry.pipeline_id,
  };
}

export { formatTimeFromIso as formatTimestamp, formatTimeFromDate as formatTime };

export function buildTimelineFromApi(
  timestamps: ApiTimestamps | null,
  stages: StageState[],
): TimelineEvent[] {
  return mapTimestamps(timestamps, stages);
}

export function getInvestigationTimeline(
  timestamps: ApiTimestamps | null,
  stages: StageState[],
): Array<{ time: string; label: string; detail?: string }> {
  const events = buildTimelineFromApi(timestamps, stages);
  return events.map((e) => ({
    time: e.time,
    label: e.label,
    detail: e.detail,
  }));
}
