import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const LiveMonitoringPage = lazy(() => import("@/features/live-monitoring/page").then(m => ({ default: m.LiveMonitoringPage })));

export const liveMonitoringRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/live-monitoring",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <LiveMonitoringPage />
    </Suspense>
  ),
});
