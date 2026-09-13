import { createFileRoute } from "@tanstack/react-router";

// ---------------------------------------------------------------------------
// Route — Movements: stock in/out history (content lands in Sprint 3)
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/movements")({
  component: MovementsPage,
});

function MovementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Movimientos</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Entradas y salidas de stock, con fecha y responsable.
        </p>
      </header>

      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface-dim px-4 py-8 text-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-10 w-10 text-text-secondary"
          aria-hidden="true"
        >
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 014-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 01-4 4H3" />
        </svg>
        <p className="text-sm font-medium text-text-primary">
          Todavía no hay movimientos registrados
        </p>
        <p className="text-sm text-text-secondary">
          Cuando empieces a mover stock, cada entrada y salida queda registrada
          acá para que siempre sepas qué pasó.
        </p>
      </div>
    </div>
  );
}
