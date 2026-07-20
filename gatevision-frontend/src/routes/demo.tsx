import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const DemoPage = lazy(() => import("@/features/demo/page").then(m => ({ default: m.DemoPage })));

export const demoRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/demo",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading Demo Center..." />}>
      <DemoPage />
    </Suspense>
  ),
});
