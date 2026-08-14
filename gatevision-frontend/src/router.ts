import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./routes/__root";
import { appLayoutRoute } from "./routes/app";
import { indexRoute } from "./routes/index";
import { recognitionRoute } from "./routes/recognition";
import { identityRoute } from "./routes/identity";
import { gateOperationsRoute } from "./routes/gate-operations";
import { reportsRoute } from "./routes/reports";
import { systemRoute } from "./routes/system";
import { adminRoute } from "./routes/admin";
import { settingsRoute } from "./routes/settings";
import { loginRoute } from "./routes/login";
import { forgotPasswordRoute } from "./routes/forgot-password";
import { sessionExpiredRoute } from "./routes/session-expired";
import { unauthorizedRoute } from "./routes/unauthorized";
import { notFoundRoute } from "./routes/not-found";

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    indexRoute,
    recognitionRoute,
    identityRoute,
    gateOperationsRoute,
    reportsRoute,
    systemRoute,
    adminRoute,
    settingsRoute,
  ]),
  loginRoute,
  forgotPasswordRoute,
  sessionExpiredRoute,
  unauthorizedRoute,
  notFoundRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
