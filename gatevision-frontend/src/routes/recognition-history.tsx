import { lazy, Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";
import { LoadingScreen } from "@/components/ui/loading-screen";

const RecognitionHistoryPage = lazy(() => import("@/features/recognition/history/page").then(m => ({ default: m.RecognitionHistoryPage })));

export const recognitionHistoryRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/recognition-history",
  component: () => (
    <Suspense fallback={<LoadingScreen message="Loading..." />}>
      <RecognitionHistoryPage />
    </Suspense>
  ),
});