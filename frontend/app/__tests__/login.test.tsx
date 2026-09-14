import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginPage } from "~/routes/login";
import { ApiError } from "~/lib/api-client";

// ---------------------------------------------------------------------------
// Mocks — hoisted so they are available inside vi.mock factories
// ---------------------------------------------------------------------------

const { mockLogin, mockNavigate } = vi.hoisted(() => ({
  mockLogin: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(
    undefined,
  ),
  mockNavigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  // createFileRoute is called at module level for the Route export;
  // the component itself does not depend on it.
  createFileRoute: vi.fn(() => vi.fn(() => ({}))),
  useNavigate: () => mockNavigate,
  useSearch: () => ({ redirect: "/dashboard" }),
}));

vi.mock("~/lib/auth-context", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isInitializing: false,
    login: mockLogin,
    logout: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LoginPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockResolvedValue(undefined);
  });

  // -- Rendering -----------------------------------------------------------

  it("renders heading, fields, submit button, and contact link", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", { name: /bienvenido de vuelta/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/tu email/i)).toBeInTheDocument();
    // Use exact string to avoid matching the toggle button's aria-label
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /contactá al administrador/i }),
    ).toBeInTheDocument();
  });

  // -- Client-side validation ----------------------------------------------

  it("shows field errors when submitting an empty form", async () => {
    render(<LoginPage />);

    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(await screen.findByText("Ingresá tu email")).toBeInTheDocument();
    expect(screen.getByText("Ingresá tu contraseña")).toBeInTheDocument();
  });

  it("shows email format error for an invalid email", async () => {
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/tu email/i), "notanemail");
    await user.type(screen.getByLabelText("Contraseña"), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(
      await screen.findByText("El formato del email no es válido"),
    ).toBeInTheDocument();
  });

  // -- Password toggle -----------------------------------------------------

  it("toggles password visibility (aria-pressed + input type)", async () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText("Contraseña");
    const toggleBtn = screen.getByRole("button", {
      name: /mostrar contraseña/i,
    });

    // Initially hidden
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(toggleBtn);

    // Now visible
    expect(passwordInput).toHaveAttribute("type", "text");
    expect(toggleBtn).toHaveAttribute("aria-pressed", "true");

    // Toggle back
    await user.click(toggleBtn);

    expect(passwordInput).toHaveAttribute("type", "password");
    expect(toggleBtn).toHaveAttribute("aria-pressed", "false");
  });

  // -- Successful login flow -----------------------------------------------

  it("calls login with typed values and navigates on success", async () => {
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/tu email/i), "user@test.com");
    await user.type(screen.getByLabelText("Contraseña"), "password123");
    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("user@test.com", "password123");
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard" });
    });
  });

  // -- Login failure feedback -----------------------------------------------

  it("clears password field after failed login", async () => {
    mockLogin.mockRejectedValue(
      new ApiError(401, { status: "error", message: "Invalid credentials" }),
    );

    render(<LoginPage />);

    const passwordInput = screen.getByLabelText("Contraseña") as HTMLInputElement;
    await user.type(screen.getByLabelText(/tu email/i), "user@test.com");
    await user.type(passwordInput, "wrongpassword");

    await user.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(passwordInput.value).toBe("");
    });
  });
});
