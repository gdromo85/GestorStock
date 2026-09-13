import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BottomNav } from "~/components/layout/bottom-nav";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@tanstack/react-router", () => ({
  // Replace Link with a plain anchor that forwards `to` as href.
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  // Return a single match so the Panel link is marked as active.
  useMatches: () => [{ pathname: "/dashboard" }],
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BottomNav", () => {
  it("renders four navigation links with correct labels", () => {
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "Panel" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Productos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Movimientos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Menú" })).toBeInTheDocument();
  });

  it("marks only the Panel link as current page", () => {
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "Panel" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: "Productos" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("link", { name: "Movimientos" }),
    ).not.toHaveAttribute("aria-current");
    expect(
      screen.getByRole("link", { name: "Menú" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("each link points to the correct route", () => {
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "Panel" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: "Productos" })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(
      screen.getByRole("link", { name: "Movimientos" }),
    ).toHaveAttribute("href", "/movements");
    expect(screen.getByRole("link", { name: "Menú" })).toHaveAttribute(
      "href",
      "/menu",
    );
  });
});
