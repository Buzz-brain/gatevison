import { get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type { NormalizedError } from "@/types/api";

export async function exportReportsApi(params: {
  format: "csv" | "json" | "excel";
  report_type?: string;
  date_from?: string;
  date_to?: string;
  filters?: Record<string, string>;
}): Promise<{ id: string; format: string; status: string; url?: string; size_kb?: number; rows?: number; error?: string; created_at: string }> {
  try {
    const response = await get<{ id: string; format: string; status: string; url?: string; size_kb?: number; rows?: number; error?: string; created_at: string }>(
      ENDPOINTS.ADMIN.EXPORT,
      { params: { ...params, filters: params.filters ? JSON.stringify(params.filters) : undefined } },
    );
    if (response.success && response.data) return response.data;
    throw { code: "UNKNOWN", message: response.message || "Export failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
