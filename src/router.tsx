import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Streams queries fetched during SSR to the browser cache, so useSuspenseQuery hydrates
  // with the server's data instead of refetching. It also wraps the app in QueryClientProvider.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
