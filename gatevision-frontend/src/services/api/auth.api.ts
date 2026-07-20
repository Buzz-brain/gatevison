import { post, get } from "@/lib/api/api-client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { normalizeError } from "@/lib/api/errors";
import type {
  LoginRequest,
  LoginResponseData,
  RefreshResponseData,
  MeResponse,
  NormalizedError,
} from "@/types/api";

export async function loginApi(
  email: string,
  password: string,
  rememberMe = false,
): Promise<LoginResponseData> {
  try {
    const payload: LoginRequest = { email, password, remember_me: rememberMe };
    const response = await post<LoginResponseData>(ENDPOINTS.AUTH.LOGIN, payload);
    if (response.success && response.data) {
      return response.data;
    }
    throw { code: "UNKNOWN", message: response.message || "Login failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function logoutApi(): Promise<void> {
  try {
    await post(ENDPOINTS.AUTH.LOGOUT);
  } catch {
    // Swallow logout errors - we clear local state regardless
  }
}

export async function getMeApi(): Promise<MeResponse> {
  try {
    const response = await get<MeResponse>(ENDPOINTS.AUTH.ME);
    if (response.success && response.data) {
      return response.data;
    }
    throw { code: "UNKNOWN", message: "Failed to fetch user profile" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function refreshTokenApi(refreshToken: string): Promise<RefreshResponseData> {
  try {
    const response = await post<RefreshResponseData>(ENDPOINTS.AUTH.REFRESH, {
      refresh_token: refreshToken,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw { code: "SESSION_EXPIRED", message: "Session refresh failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function registerApi(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<LoginResponseData> {
  try {
    const response = await post<LoginResponseData>(ENDPOINTS.AUTH.REGISTER, {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    if (response.success && response.data) {
      return response.data;
    }
    throw { code: "UNKNOWN", message: response.message || "Registration failed" } as NormalizedError;
  } catch (error) {
    throw normalizeError(error);
  }
}
