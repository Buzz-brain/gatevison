import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const AdminPage = lazy(() => import("@/features/administration/page").then(m => ({ default: m.AdminPage })));

export const adminRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/admin",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <AdminPage />
    </Suspense>
  ),
});
