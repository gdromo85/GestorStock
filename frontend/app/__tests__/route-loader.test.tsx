import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RouteLoader } from "~/components/ui/route-loader";

describe("RouteLoader", () => {
  it("renders 'Cargando…' text", () => {
    render(<RouteLoader />);
    expect(screen.getByText("Cargando…")).toBeInTheDocument();
  });

  it("has aria-busy attribute set to true", () => {
    render(<RouteLoader />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
  });
});
