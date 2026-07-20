import type { NormalizedError, AuthErrorCode } from "@/types/api";
import { AxiosError } from "axios";

const HTTP_ERROR_MAP: Record<number, { code: AuthErrorCode; message: string }> = {
  400: { code: "VALIDATION_ERROR", message: "Invalid request data. Please check your input." },
  401: { code: "UNAUTHORIZED", message: "Your session has expired. Please log in again." },
  403: { code: "FORBIDDEN", message: "You do not have permission to perform this action." },
  404: { code: "NOT_FOUND", message: "The requested resource was not found." },
  422: { code: "VALIDATION_ERROR", message: "Validation failed. Please check your input." },
  429: { code: "RATE_LIMITED", message: "Too many requests. Please wait before trying again." },
  500: { code: "SERVER_ERROR", message: "An unexpected server error occurred. Please try again." },
  502: { code: "SERVER_ERROR", message: "The server is temporarily unavailable. Please try again." },
  503: { code: "SERVER_ERROR", message: "Service is temporarily unavailable. Please try again." },
};

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof AxiosError) {
    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        return { code: "NETWORK_ERROR", message: "Request timed out. Please check your connection.", status: 0 };
      }
      if (!navigator.onLine) {
        return { code: "OFFLINE", message: "No internet connection. Please check your network.", status: 0 };
      }
      return { code: "NETWORK_ERROR", message: "Network error. Please check your connection.", status: 0 };
    }

    const status = error.response.status;
    const data = error.response.data as Record<string, unknown> | undefined;
    const mapped = HTTP_ERROR_MAP[status];

    if (status === 401) {
      return {
        code: "SESSION_EXPIRED",
        message: "Your session has expired. Please log in again.",
        status: 401,
      };
    }

    if (data && typeof data === "object") {
      const detail = data.detail as string | undefined;
      const code = data.code as string | undefined;
      if (detail) {
        return {
          code: (code as AuthErrorCode) ?? mapped?.code ?? "UNKNOWN",
          message: detail,
          status,
          field: (data.field as string) ?? undefined,
        };
      }
      const message = data.message as string | undefined;
      if (message) {
        return {
          code: (code as AuthErrorCode) ?? mapped?.code ?? "UNKNOWN",
          message,
          status,
          field: (data.field as string) ?? undefined,
        };
      }
    }

    return {
      code: mapped?.code ?? "UNKNOWN",
      message: mapped?.message ?? "An unexpected error occurred.",
      status,
    };
  }

  if (error instanceof Error) {
    return { code: "UNKNOWN", message: error.message || "An unexpected error occurred." };
  }

  return { code: "UNKNOWN", message: "An unexpected error occurred." };
}

export function createLoginError(
  code: AuthErrorCode,
  message: string,
  extra?: Partial<NormalizedError>,
): NormalizedError {
  return { code, message, ...extra };
}
