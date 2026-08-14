import type { LucideIcon } from "lucide-react";

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "down";

export interface ServiceStatus {
  id: string;
  name: string;
  status: HealthStatus;
  label: string;
}

export interface OverallHealth {
  status: HealthStatus;
  score: number;
  services: ServiceStatus[];
}

export type ModelId = "yolo" | "easyocr" | "insightface" | "resnet50" | "decision";

export interface AiModelInfo {
  id: ModelId;
  name: string;
  type: string;
  status: HealthStatus;
  version: string;
  loaded: boolean;
  lastLoaded: string;
}

export interface StatusConfigEntry {
  label: string;
  hex: string;
  icon: LucideIcon;
}

export interface VersionEntry {
  component: string;
  version: string;
  updated?: string;
  status?: HealthStatus;
}
