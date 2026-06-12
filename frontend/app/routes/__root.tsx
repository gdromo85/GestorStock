import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import appCss from "~/styles/app.css?url";
import { AuthProvider } from "~/lib/auth-context";
import type { RouterContext } from "~/router";

// ---------------------------------------------------------------------------
// Root route
// ---------------------------------------------------------------------------

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "description", content: "GestorStock — Stock control for workshops" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  errorComponent: ({ error }) => (
    <RootDocument>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-danger">Something went wrong</h1>
          <p className="mt-2 text-text-secondary">{error.message}</p>
          <button
            className="mt-4 min-h-touch rounded-lg bg-primary-600 px-6 py-3 text-text-inverse font-medium hover:bg-primary-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    </RootDocument>
  ),
  notFoundComponent: () => (
    <RootDocument>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary">404</h1>
          <p className="mt-2 text-text-secondary">Page not found</p>
        </div>
      </div>
    </RootDocument>
  ),
  component: RootComponent,
});

// ---------------------------------------------------------------------------
// Root component — wraps the tree with providers
// ---------------------------------------------------------------------------

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </QueryClientProvider>
    </RootDocument>
  );
}

// ---------------------------------------------------------------------------
// HTML shell
// ---------------------------------------------------------------------------

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-surface text-text-primary antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
