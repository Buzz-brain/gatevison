import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const AccessControlPage = lazy(() => import("@/features/access-control/page").then(m => ({ default: m.AccessControlPage })));

export const accessControlRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/access-control",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <AccessControlPage />
    </Suspense>
  ),
});
