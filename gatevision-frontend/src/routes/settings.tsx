import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const SettingsPage = lazy(() => import("@/features/settings/page").then(m => ({ default: m.SettingsPage })));

export const settingsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/settings",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <SettingsPage />
    </Suspense>
  ),
});
