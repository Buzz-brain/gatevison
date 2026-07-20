import { type ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";
import { LoadingScreen } from "@/components/ui/loading-screen";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
}

function ProtectedRoute({ children, requiredPermissions }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isInitialized, isAuthenticated]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

interface GuestRouteProps {
  children: ReactNode;
}

function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isInitialized, isAuthenticated]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export { ProtectedRoute, GuestRoute };
