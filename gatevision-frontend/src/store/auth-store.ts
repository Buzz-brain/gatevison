import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NormalizedError } from "@/types/api";
import { loginApi, logoutApi, getMeApi, refreshTokenApi } from "@/services/api/auth.api";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  permissions: string[];
  lastLogin: string | null;
  createdAt: string;
  isActive: boolean;
}

interface AuthStoreState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: NormalizedError | null;
  remainingAttempts: number;
  isSystemInitShowing: boolean;
}

interface AuthStoreActions {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  setSystemInitComplete: () => void;
  getInitialized: () => Promise<void>;
  setUser: (user: User) => void;
}

type AuthStore = AuthStoreState & AuthStoreActions;

function mapUser(data: { id: string; email: string; first_name: string; last_name: string; role: string; is_active: boolean; last_login: string | null; created_at: string }): User {
  return {
    id: data.id,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    role: data.role,
    permissions: [],
    lastLogin: data.last_login,
    createdAt: data.created_at,
    isActive: data.is_active,
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: false,
      error: null,
      remainingAttempts: 5,
      isSystemInitShowing: false,

      getInitialized: async () => {
        const { token } = get();
        if (!token) {
          set({ isInitialized: true, isLoading: false });
          return;
        }
        try {
          const me = await getMeApi();
          set({
            user: mapUser(me),
            isAuthenticated: true,
            isInitialized: true,
            isLoading: false,
          });
        } catch {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
          });
        }
      },

      login: async (email: string, password: string, rememberMe = false) => {
        set({ isLoading: true, error: null });
        try {
          const response = await loginApi(email, password, rememberMe);
          const user = response.user;
          set({
            token: response.access_token,
            refreshToken: response.refresh_token ?? null,
            user: mapUser(user),
            isAuthenticated: true,
            isLoading: false,
            error: null,
            remainingAttempts: 5,
            isSystemInitShowing: true,
          });
        } catch (err) {
          const normalized = err as NormalizedError;
          const remaining = Math.max(0, (get().remainingAttempts || 5) - 1);
          set({
            isLoading: false,
            error: normalized,
            isAuthenticated: false,
            remainingAttempts: normalized.code === "INVALID_CREDENTIALS" ? remaining : get().remainingAttempts,
          });
          throw normalized;
        }
      },

      logout: async () => {
        try {
          await logoutApi();
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            remainingAttempts: 5,
            isSystemInitShowing: false,
          });
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return;
        try {
          const response = await refreshTokenApi(refreshToken);
          set({
            token: response.access_token,
            refreshToken: response.refresh_token ?? null,
          });
        } catch {
          await get().logout();
        }
      },

      clearError: () => set({ error: null }),

      setSystemInitComplete: () => set({ isSystemInitShowing: false }),

      setUser: (user: User) => set({ user }),
    }),
    {
      name: "gatevision-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
