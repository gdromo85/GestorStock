import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createQueryClient } from "./lib/query-client";
import { authStore } from "./lib/auth-store";

// ---------------------------------------------------------------------------
// Router context — available in beforeLoad / loader of every route
// ---------------------------------------------------------------------------

export interface RouterContext {
  queryClient: ReturnType<typeof createQueryClient>;
  auth: typeof authStore;
}

export function getRouter() {
  const queryClient = createQueryClient();

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    context: {
      queryClient,
      auth: authStore,
    },
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
