import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import appCss from "~/styles/app.css?url";
import { AuthProvider } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";
import type { RouterContext } from "~/router";

// ---------------------------------------------------------------------------
// Root route
// ---------------------------------------------------------------------------

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "description", content: "GestorStock — Control de stock de Argojardín" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/logo-argojardin.png" },
    ],
  }),
  errorComponent: ({ error }) => (
    <RootDocument>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-danger">Algo salió mal</h1>
          <p className="mt-2 text-text-secondary">{error.message}</p>
          <Button className="mt-4 px-6" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    </RootDocument>
  ),
  notFoundComponent: () => (
    <RootDocument>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-primary">404</h1>
          <p className="mt-2 text-text-secondary">Página no encontrada</p>
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
