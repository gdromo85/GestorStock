import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TopBar } from "~/components/layout/top-bar";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("~/lib/auth-context", () => ({
  useAuth: () => ({
    user: {
      id: "1",
      name: "Juan Perez",
      email: "juan@argojardin.com",
      role: "ADMIN",
      isActive: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    isAuthenticated: true,
    isInitializing: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TopBar", () => {
  it("renders the brand logo image", () => {
    const { container } = render(<TopBar />);
    const img = container.querySelector("img");

    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/logo-argojardin.png");
    expect(img).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the GestorStock title", () => {
    render(<TopBar />);
    expect(
      screen.getByRole("heading", { name: "GestorStock" }),
    ).toBeInTheDocument();
  });

  it("renders the user initials JP", () => {
    render(<TopBar />);
    expect(screen.getByText("JP")).toBeInTheDocument();
  });

  it("shows the user name as accessible label on the avatar", () => {
    render(<TopBar />);
    expect(screen.getByLabelText("Juan Perez")).toBeInTheDocument();
  });
});
