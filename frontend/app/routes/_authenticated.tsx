import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { authStore } from "~/lib/auth-store";
import { TopBar } from "~/components/layout/top-bar";
import { BottomNav } from "~/components/layout/bottom-nav";

// ---------------------------------------------------------------------------
// Route — pathless layout for authenticated pages
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // Wait for session restore to complete before deciding
    await authStore.initialized;

    if (!authStore.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function AuthenticatedLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(var(--spacing-touch)+2rem)]">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
