import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
      <p className="mt-2 text-text-secondary">
        Welcome to GestorStock. Dashboard content will be added in Sprint 3.
      </p>
    </div>
  );
}
