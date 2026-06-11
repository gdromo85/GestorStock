import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
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
            className="mt-4 rounded-lg bg-primary-600 px-6 py-3 text-text-inverse font-medium"
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

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

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
