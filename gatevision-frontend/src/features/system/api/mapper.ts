import type {
  ApiSystemHealth, ApiModelHealth, ApiVersionInformation,
} from "./types";
import type {
  OverallHealth, AiModelInfo, VersionEntry, ModelId,
} from "../types";

export function mapOverallHealth(api: ApiSystemHealth): OverallHealth {
  const status = api.status;
  const services = [
    { id: "database", name: "Database", status: api.database as OverallHealth["services"][number]["status"], label: api.database },
    { id: "cameras", name: "Cameras", status: api.cameras as OverallHealth["services"][number]["status"], label: api.cameras },
    { id: "pipeline", name: "AI Pipeline", status: api.pipeline as OverallHealth["services"][number]["status"], label: api.pipeline },
    { id: "storage", name: "Storage", status: api.storage as OverallHealth["services"][number]["status"], label: api.storage },
    { id: "ai_services", name: "AI Services", status: api.ai_services as OverallHealth["services"][number]["status"], label: api.ai_services },
  ];
  const scoreMap: Record<string, number> = { healthy: 99, degraded: 70, unhealthy: 30 };
  const total = services.reduce((s, svc) => s + (scoreMap[svc.status] ?? 50), 0);
  const score = Math.round(total / services.length);
  return { status, score, services };
}

export function mapAiModels(apiModels: ApiModelHealth[]): AiModelInfo[] {
  return apiModels.map((m) => ({
    id: m.id as ModelId,
    name: m.name,
    type: m.id === "yolo" ? "Object Detection" : m.id === "easyocr" ? "License Plate OCR" : m.id === "insightface" ? "Face Recognition" : m.id === "resnet50" ? "Vehicle Classification" : "Decision Engine",
    status: m.status as AiModelInfo["status"],
    version: m.version,
    loaded: m.status === "healthy" || m.status === "degraded",
    lastLoaded: m.last_loaded,
  }));
}

export function mapVersionInfo(api: ApiVersionInformation): VersionEntry[] {
  const entries: VersionEntry[] = [
    { component: "GateVision Core", version: api.version, updated: api.built_at, status: "healthy" },
    { component: "Python", version: api.python, status: "healthy" },
    { component: "FastAPI", version: api.fastapi, status: "healthy" },
    { component: "MongoDB", version: api.mongodb, status: "healthy" },
    { component: "OpenCV", version: api.opencv, status: "healthy" },
    { component: "PyTorch", version: api.pytorch, status: "healthy" },
    { component: "YOLO", version: api.yolo, status: "healthy" },
    { component: "EasyOCR", version: api.easyocr, status: "healthy" },
  ];
  return entries;
}
