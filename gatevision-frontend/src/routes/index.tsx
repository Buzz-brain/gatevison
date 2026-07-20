import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const DashboardPage = lazy(() => import("@/features/dashboard/page").then(m => ({ default: m.DashboardPage })));

export const indexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <DashboardPage />
    </Suspense>
  ),
});
