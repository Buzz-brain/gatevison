import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";
import { getMeApi } from "@/services/api/auth.api";

export function useSessionGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const warned = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const check = setInterval(async () => {
      try {
        await getMeApi();
        warned.current = false;
      } catch {
        if (!warned.current) {
          warned.current = true;
          useAuthStore.getState().logout();
          navigate({ to: "/session-expired" });
        }
      }
    }, 60_000);

    return () => clearInterval(check);
  }, [isAuthenticated]);
}
