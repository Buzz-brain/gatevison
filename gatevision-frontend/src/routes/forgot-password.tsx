import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { LoadingScreen } from "@/components/ui/loading-screen";

const ForgotPasswordPage = lazy(() => import("@/features/auth/pages/forgot-password-page").then(m => ({ default: m.ForgotPasswordPage })));

export const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <ForgotPasswordPage />
    </Suspense>
  ),
});
