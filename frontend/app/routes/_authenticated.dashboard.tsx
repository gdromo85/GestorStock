import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth-context";

// ---------------------------------------------------------------------------
// Route — Dashboard: the workshop's home screen
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <header>
        <h1 className="text-2xl font-bold text-text-primary">
          {firstName ? `Hola, ${firstName}` : "Hola"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">¿Qué necesitás hoy?</p>
      </header>

      {/* Primary action — product search */}
      <Link
        to="/products"
        className="flex min-h-touch items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-text-secondary shadow-sm transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
        aria-label="Buscar repuesto o producto"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="text-base">Buscar repuesto o producto</span>
      </Link>

      {/* Stock bajo */}
      <section aria-labelledby="stock-bajo-heading">
        <h2
          id="stock-bajo-heading"
          className="text-base font-semibold text-text-primary"
        >
          Stock bajo
        </h2>
        <div className="mt-2 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface-dim px-4 py-6 text-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-text-secondary"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p className="text-sm text-text-secondary">
            Cuando cargues tu stock, los productos que quedan pocos aparecen
            acá para que no te falte nunca nada.
          </p>
        </div>
      </section>

      {/* Movimientos recientes */}
      <section aria-labelledby="movimientos-heading">
        <h2
          id="movimientos-heading"
          className="text-base font-semibold text-text-primary"
        >
          Movimientos recientes
        </h2>
        <div className="mt-2 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface-dim px-4 py-6 text-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-text-secondary"
            aria-hidden="true"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 014-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 01-4 4H3" />
          </svg>
          <p className="text-sm text-text-secondary">
            Todavía no hay movimientos. Cada entrada y salida de stock va a
            quedar registrada acá.
          </p>
        </div>
      </section>
    </div>
  );
}
