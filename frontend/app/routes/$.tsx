import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-4xl font-bold text-text-primary">404</h1>
      <p className="text-text-secondary">Esta página no existe.</p>
      <Link
        to="/"
        className="inline-flex min-h-touch items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-text-inverse font-medium hover:bg-primary-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
      >
        Ir al inicio
      </Link>
    </div>
  );
}
