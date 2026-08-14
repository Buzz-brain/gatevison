import { get, post } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import { api } from "@/lib/api/axios";
import type { NormalizedError } from "@/types/api";

export interface CameraStatus {
  camera_id: string;
  is_running: boolean;
  source: number;
  frame_count: number;
  status: "running" | "stopped";
  uptime_seconds?: number;
  resolution?: string;
  fps?: number | "unknown";
}

export interface DetectedCamera {
  source: number;
  resolution: string;
}

export interface DetectCamerasResult {
  cameras: DetectedCamera[];
  count: number;
}

export async function startCameraApi(source = 0): Promise<CameraStatus> {
  try {
    const response = await api.post<{ success: boolean; data: CameraStatus; message: string }>(
      ENDPOINTS.CAMERA.START,
      undefined,
      { params: { source } },
    );
    if (response.data.data) return response.data.data;
    throw { code: "UNKNOWN", message: response.data.message || "Camera start failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function stopCameraApi(): Promise<Pick<CameraStatus, "camera_id" | "status">> {
  try {
    const response = await post<Pick<CameraStatus, "camera_id" | "status">>(ENDPOINTS.CAMERA.STOP);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Camera stop failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getCameraStatusApi(): Promise<CameraStatus> {
  try {
    const response = await get<CameraStatus>(ENDPOINTS.CAMERA.STATUS);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to fetch camera status" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function detectCamerasApi(): Promise<DetectCamerasResult> {
  try {
    const response = await get<DetectCamerasResult>(ENDPOINTS.CAMERA.DETECT ?? "/camera/detect");
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to detect cameras" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function captureCameraApi(): Promise<Record<string, unknown>> {
  try {
    const response = await post<Record<string, unknown>>(ENDPOINTS.CAMERA.CAPTURE);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Camera capture failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
