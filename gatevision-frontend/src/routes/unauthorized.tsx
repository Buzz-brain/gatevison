import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { LoadingScreen } from "@/components/ui/loading-screen";

const UnauthorizedPage = lazy(() => import("@/features/auth/pages/unauthorized-page").then(m => ({ default: m.UnauthorizedPage })));

export const unauthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/unauthorized",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <UnauthorizedPage />
    </Suspense>
  ),
});
