import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { AppLayout } from "@/layouts/app-layout";

export const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppLayout,
});
