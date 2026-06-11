import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TopBar placeholder — Phase 3 */}
      <header className="sticky top-0 z-40 flex h-touch items-center border-b border-border bg-surface px-4">
        <span className="text-lg font-semibold text-primary-700">
          GestorStock
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-[calc(var(--spacing-touch)+2rem)]">
        <Outlet />
      </main>

      {/* BottomNav placeholder — Phase 3 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-touch items-center justify-around border-t border-border bg-surface">
        <span className="text-xs text-text-secondary">Nav placeholder</span>
      </nav>
    </div>
  );
}
