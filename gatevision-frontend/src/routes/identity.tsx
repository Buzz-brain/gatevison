import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const IdentityPage = lazy(() => import("@/features/identity/page").then(m => ({ default: m.IdentityPage })));

export const identityRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/identity",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <IdentityPage />
    </Suspense>
  ),
});
