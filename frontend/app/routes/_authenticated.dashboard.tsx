import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-text-primary">Panel</h1>
      <p className="mt-2 text-text-secondary">
        Bienvenido a GestorStock. El contenido del panel llegará en el Sprint 3.
      </p>
    </div>
  );
}
