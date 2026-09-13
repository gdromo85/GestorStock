import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "~/lib/auth-context";
import { Button } from "~/components/ui/button";

// ---------------------------------------------------------------------------
// Route — Menu: account, session, and app info
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated/menu")({
  component: MenuPage,
});

function MenuPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-text-primary">Menú</h1>
        <p className="mt-1 text-sm text-text-secondary">Tu cuenta y sesión.</p>
      </header>

      {/* Account card */}
      <section
        aria-labelledby="account-heading"
        className="rounded-xl border border-border bg-surface p-4 shadow-sm"
      >
        <h2 id="account-heading" className="sr-only">
          Cuenta
        </h2>
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-base font-bold text-primary-700"
            aria-hidden="true"
          >
            {user
              ? user.name
                  .split(" ")
                  .map((part) => part[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-text-primary">
              {user?.name ?? "Usuario"}
            </p>
            <p className="truncate text-sm text-text-secondary">
              {user?.email ?? ""}
            </p>
            {user?.role && (
              <span className="mt-1 inline-block rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-600">
                {user.role === "ADMIN" ? "Administrador" : "Mecánico"}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* App info */}
      <section
        aria-labelledby="app-heading"
        className="rounded-xl border border-border bg-surface p-4 shadow-sm"
      >
        <h2
          id="app-heading"
          className="text-base font-semibold text-text-primary"
        >
          GestorStock
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Sistema de stock de Argojardín — service y repuestos de
          motoimplementos. Est. 2015.
        </p>
      </section>

      {/* Session */}
      <Button variant="danger" onClick={handleLogout}>
        Cerrar sesión
      </Button>
    </div>
  );
}
