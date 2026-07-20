import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { GuestRoute } from "@/features/auth/components/auth-guard";

const LoginPage = lazy(() => import("@/features/auth/pages/login-page").then(m => ({ default: m.LoginPage })));

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: () => (
    <Suspense fallback={<LoadingScreen />}>
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    </Suspense>
  ),
});
