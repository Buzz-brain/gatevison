import { api } from "./axios";
import { normalizeError } from "./errors";
import type { ApiResponse } from "@/types/api";

export async function get<T>(url: string, params?: Record<string, unknown>, signal?: AbortSignal): Promise<ApiResponse<T>> {
  try {
    const response = await api.get<ApiResponse<T>>(url, { params, signal });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function post<T>(url: string, data?: unknown, signal?: AbortSignal): Promise<ApiResponse<T>> {
  try {
    const response = await api.post<ApiResponse<T>>(url, data, { signal });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function put<T>(url: string, data?: unknown, signal?: AbortSignal): Promise<ApiResponse<T>> {
  try {
    const response = await api.put<ApiResponse<T>>(url, data, { signal });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function del<T>(url: string, signal?: AbortSignal): Promise<ApiResponse<T>> {
  try {
    const response = await api.delete<ApiResponse<T>>(url, { signal });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getRaw<T>(url: string, params?: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  try {
    const response = await api.get<T>(url, { params, signal });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function postRaw<T>(url: string, data?: unknown, signal?: AbortSignal): Promise<T> {
  try {
    const response = await api.post<T>(url, data, { signal });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
