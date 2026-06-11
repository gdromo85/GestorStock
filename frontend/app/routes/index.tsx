import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold text-primary-700">GestorStock</h1>
      <p className="text-text-secondary">
        Stock control system for workshops
      </p>
      <Link
        to="/login"
        className="rounded-lg bg-primary-600 px-6 py-3 text-text-inverse font-medium hover:bg-primary-700 transition-colors"
      >
        Go to Login
      </Link>
    </div>
  );
}
