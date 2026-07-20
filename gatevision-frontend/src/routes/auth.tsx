import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { AuthLayout } from "@/layouts/auth-layout";

export const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth",
  component: AuthLayout,
});
