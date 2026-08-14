import { createRoute, redirect } from "@tanstack/react-router";
import { appLayoutRoute } from "./app";

export const indexRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/recognition" });
  },
  component: () => null,
});
