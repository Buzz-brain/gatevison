import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { LoadingScreen } from "@/components/ui/loading-screen";

const NotFoundPage = lazy(() => import("@/features/auth/pages/not-found-page").then(m => ({ default: m.NotFoundPage })));

export const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$splat",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <NotFoundPage />
    </Suspense>
  ),
});
