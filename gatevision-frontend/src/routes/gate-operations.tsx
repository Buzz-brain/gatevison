import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const GateOperationsPage = lazy(() => import("@/features/gate-operations/page").then(m => ({ default: m.GateOperationsPage })));

export const gateOperationsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/gate-operations",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <GateOperationsPage />
    </Suspense>
  ),
});
