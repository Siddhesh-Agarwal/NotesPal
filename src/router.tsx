import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { CatchBoundaryPage } from "./components/page/catch-error";
import NotFoundPage from "./components/page/not-found";
import { queryClient } from "./integrations/query";
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: { queryClient },
    caseSensitive: true,
    defaultPreload: "intent",
    defaultErrorComponent: CatchBoundaryPage,
    defaultNotFoundComponent: () =>
      NotFoundPage({
        backTo: "/",
      }),
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      );
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};
