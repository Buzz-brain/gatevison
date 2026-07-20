import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const STORAGE_KEY = "gatevision-auth";

interface PersistedAuth {
  user: unknown | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface ZustandPersisted {
  state: PersistedAuth;
  version: number;
}

function readPersistedAuth(): PersistedAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Zustand persist wraps in { state: {...}, version: N }
    if (parsed.state && "token" in parsed.state) {
      return parsed.state as PersistedAuth;
    }
    return parsed as PersistedAuth;
  } catch {
    return null;
  }
}

function getToken(): string | null {
  return readPersistedAuth()?.token ?? null;
}

function updateStoredToken(token: string, refreshToken?: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    // Zustand persist format: { state: {...}, version: N }
    if (parsed.state && "token" in parsed.state) {
      parsed.state.token = token;
      if (refreshToken) parsed.state.refreshToken = refreshToken;
    } else {
      parsed.token = token;
      if (refreshToken) parsed.refreshToken = refreshToken;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Best-effort
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  for (const item of failedQueue) {
    if (error) {
      item.reject(error);
    } else if (token) {
      item.resolve(token);
    }
  }
  failedQueue = [];
}

export const TOKEN_REFRESH_EVENT = "gatevision:token-refresh";

export function setupRequestInterceptor(api: AxiosInstance) {
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (config.headers) {
        config.headers["Content-Type"] = config.headers["Content-Type"] ?? "application/json";
        config.headers.Accept = "application/json";
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
}

export function setupResponseInterceptor(api: AxiosInstance) {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const auth = readPersistedAuth();
          const refreshToken = auth?.refreshToken ?? null;

          if (!refreshToken) {
            processQueue(new Error("No refresh token"));
            isRefreshing = false;
            return Promise.reject(error);
          }

          const response = await api.post("/auth/refresh", { refresh_token: refreshToken });
          const data = response.data?.data ?? response.data;

          const newToken: string = data.access_token ?? data.token;
          const newRefreshToken: string | undefined = data.refresh_token ?? data.refreshToken;

          if (newToken) {
            updateStoredToken(newToken, newRefreshToken);
          }

          window.dispatchEvent(new CustomEvent(TOKEN_REFRESH_EVENT, { detail: { token: newToken } }));
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem(STORAGE_KEY);
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );
}
