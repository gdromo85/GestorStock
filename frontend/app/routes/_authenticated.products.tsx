import { createFileRoute } from "@tanstack/react-router";

// ---------------------------------------------------------------------------
// Route — Products: search and stock (content lands in Sprint 3)
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/products")({
  component: ProductsPage,
});

function ProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Productos</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Repuestos, insumos y motoimplementos en stock.
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
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
        <p className="text-sm font-medium text-text-primary">
          Todavía no hay productos cargados
        </p>
        <p className="text-sm text-text-secondary">
          Acá vas a buscar repuestos y productos, y ver el stock de cada uno al
          instante.
        </p>
      </div>
    </div>
  );
}
