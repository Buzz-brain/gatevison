export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  error?: ApiErrorDetail;
}

export interface ApiErrorDetail {
  code: string;
  detail: string;
  field?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  database: "connected" | "disconnected";
  uptime: number;
  timestamp: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponseData {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: UserResponse;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponseData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface UserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export type UserRole = "admin" | "security_officer" | "operator" | "viewer";

export interface MeResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  permissions: string[];
  last_login: string | null;
  created_at: string;
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_LOCKED"
  | "TOO_MANY_ATTEMPTS"
  | "SESSION_EXPIRED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "OFFLINE"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UNKNOWN";

export interface NormalizedError {
  code: AuthErrorCode;
  message: string;
  status?: number;
  retryAfter?: number;
  remainingAttempts?: number;
  field?: string;
}
