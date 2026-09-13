import { useAuth } from "~/lib/auth-context";

// ---------------------------------------------------------------------------
// TopBar — fixed top bar for authenticated layout
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function TopBar() {
  const { user } = useAuth();
  const initials = user ? getInitials(user.name) : "?";

  return (
    <header
      className="sticky top-0 z-40 flex h-touch items-center justify-between border-b border-border bg-surface px-4"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Brand logo */}
      <img
        src="/logo-argojardin.png"
        alt=""
        className="h-7 w-7 object-contain"
        aria-hidden="true"
      />

      {/* Centered title */}
      <h1 className="text-lg font-semibold text-primary-700">GestorStock</h1>

      {/* User avatar */}
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700"
        aria-label={user?.name ?? "User"}
        title={user?.email ?? ""}
      >
        {initials}
      </div>
    </header>
  );
}
