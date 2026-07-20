import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const SystemPage = lazy(() => import("@/features/system/page").then(m => ({ default: m.SystemPage })));

export const systemRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/system",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <SystemPage />
    </Suspense>
  ),
});
