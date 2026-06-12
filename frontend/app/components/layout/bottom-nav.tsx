import { Link, useMatches } from "@tanstack/react-router";
import { cn } from "~/lib/cn";

// ---------------------------------------------------------------------------
// BottomNav — fixed bottom navigation for authenticated layout
// ---------------------------------------------------------------------------

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    to: "/products",
    label: "Products",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    to: "/movements",
    label: "Movements",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 014-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
    ),
  },
  {
    to: "/menu",
    label: "Menu",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const matches = useMatches();
  const pathname = matches.at(-1)?.pathname ?? "/";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="flex h-touch items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.to || pathname.startsWith(item.to + "/");

          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={cn(
                  "flex min-h-touch min-w-touch flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors",
                  isActive
                    ? "text-primary-600"
                    : "text-text-secondary hover:text-text-primary",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}
                <span className="text-[10px] font-medium leading-tight">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
