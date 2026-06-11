import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-4xl font-bold text-text-primary">404</h1>
      <p className="text-text-secondary">This page does not exist.</p>
      <a
        href="/"
        className="rounded-lg bg-primary-600 px-6 py-3 text-text-inverse font-medium hover:bg-primary-700 transition-colors"
      >
        Go Home
      </a>
    </div>
  );
}
