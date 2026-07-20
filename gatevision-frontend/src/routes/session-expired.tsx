import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { LoadingScreen } from "@/components/ui/loading-screen";

const SessionExpiredPage = lazy(() => import("@/features/auth/pages/session-expired-page").then(m => ({ default: m.SessionExpiredPage })));

export const sessionExpiredRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/session-expired",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <SessionExpiredPage />
    </Suspense>
  ),
});
