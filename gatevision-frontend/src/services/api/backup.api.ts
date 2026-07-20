import { get, post } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { ApiBackupRecord } from "@/features/system/api/types";
import type { NormalizedError } from "@/types/api";

export async function getBackupsApi(): Promise<ApiBackupRecord[]> {
  try {
    const response = await get<Record<string, unknown>>(ENDPOINTS.SYSTEM.BACKUP.LIST);
    if (response.success && response.data) {
      const raw = response.data as Record<string, unknown>;
      return (raw.backups as ApiBackupRecord[]) ?? [];
    }
    return [];
  } catch {
    return [];
  }
}

export async function exportBackupApi(): Promise<{ success: boolean; backup_id: string; message: string }> {
  try {
    const response = await post<{ success: boolean; backup_id: string; message: string }>(ENDPOINTS.SYSTEM.BACKUP.EXPORT);
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to export backup" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function importBackupApi(backupId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await post<{ success: boolean; message: string }>(ENDPOINTS.SYSTEM.BACKUP.IMPORT, { backup_id: backupId });
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Failed to import backup" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
