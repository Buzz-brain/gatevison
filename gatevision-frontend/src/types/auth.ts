export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRoleType;
  avatar?: string;
  permissions: string[];
  lastLogin: string;
  createdAt: string;
  isActive: boolean;
}

export type UserRoleType = "admin" | "security_officer" | "operator" | "viewer";

export interface SessionInfo {
  token: string;
  refreshToken: string;
  expiresAt: string;
  rememberMe: boolean;
}

export interface AuthError {
  code: AuthErrorCode;
  message: string;
  retryAfter?: number;
  remainingAttempts?: number;
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_LOCKED"
  | "TOO_MANY_ATTEMPTS"
  | "SESSION_EXPIRED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "OFFLINE"
  | "UNKNOWN";

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;
  remainingAttempts: number;
}
