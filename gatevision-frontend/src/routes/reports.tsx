import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const ReportsPage = lazy(() => import("@/features/reports/page").then(m => ({ default: m.ReportsPage })));

export const reportsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/reports",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <ReportsPage />
    </Suspense>
  ),
});
