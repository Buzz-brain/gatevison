import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";

export function useAuth() {
  const store = useAuthStore();
  const navigate = useNavigate();
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!store.isInitialized) {
      store.getInitialized();
    }
  }, []);

  useEffect(() => {
    if (store.isAuthenticated && store.refreshToken) {
      const interval = setInterval(() => {
        store.refreshAuth();
      }, 5 * 60 * 1000);
      refreshIntervalRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [store.isAuthenticated, store.refreshToken]);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      await store.login(email, password, rememberMe);
    },
    [],
  );

  const logout = useCallback(async () => {
    await store.logout();
    navigate({ to: "/login" });
  }, []);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isInitialized: store.isInitialized,
    error: store.error,
    remainingAttempts: store.remainingAttempts,
    isSystemInitShowing: store.isSystemInitShowing,
    login,
    logout,
    refreshAuth: store.refreshAuth,
    clearError: store.clearError,
    setSystemInitComplete: store.setSystemInitComplete,
  };
}
