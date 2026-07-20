import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const RecognitionCenterPage = lazy(() => import("@/features/recognition/page").then(m => ({ default: m.RecognitionCenterPage })));

export const recognitionRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/recognition",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <RecognitionCenterPage />
    </Suspense>
  ),
});
