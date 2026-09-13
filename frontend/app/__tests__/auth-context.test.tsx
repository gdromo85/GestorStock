import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "~/lib/auth-context";
import { authStore } from "~/lib/auth-store";

// ---------------------------------------------------------------------------
// Mocks — hoisted for vi.mock factories
// ---------------------------------------------------------------------------

const { mockGet, mockPost } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock("~/lib/api-client", () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
  },
  // AuthProvider imports ApiError (unused in component logic, but required by the import).
  ApiError: class ApiError extends Error {
    statusCode: number;
    body: unknown;
    constructor(statusCode: number, body: unknown) {
      super((body as { message?: string })?.message ?? "Error");
      this.name = "ApiError";
      this.statusCode = statusCode;
      this.body = body;
    }
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUser = {
  id: "1",
  name: "Test User",
  email: "test@test.com",
  role: "ADMIN",
  isActive: true,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

/** Tiny consumer that exposes auth state via data-testid attributes. */
function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user-name">{auth.user?.name ?? "null"}</span>
      <span data-testid="is-auth">{String(auth.isAuthenticated)}</span>
      <span data-testid="is-init">{String(auth.isInitializing)}</span>
      <button
        data-testid="btn-login"
        onClick={() => auth.login("test@test.com", "password123")}
      >
        login
      </button>
      <button data-testid="btn-logout" onClick={() => auth.logout()}>
        logout
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuthProvider", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    authStore.clearAuth();
    authStore.markInitialized(); // safe no-op after first call
    window.localStorage.clear();
  });

  // -- Session restore on mount --------------------------------------------

  it("calls GET /api/auth/me on mount and exposes the user", async () => {
    mockGet.mockResolvedValueOnce({ data: mockUser });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-init")).toHaveTextContent("false");
    });

    expect(mockGet).toHaveBeenCalledWith("/api/auth/me");
    expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
    expect(authStore.user?.name).toBe("Test User");
  });

  it("marks provider as initialized even when /me fails", async () => {
    mockGet.mockRejectedValueOnce(new Error("network"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-init")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("user-name")).toHaveTextContent("null");
  });

  // -- login() -------------------------------------------------------------

  it("login stores token in authStore and never in localStorage", async () => {
    mockGet.mockResolvedValueOnce({ data: null }); // no existing session
    mockPost.mockResolvedValueOnce({
      data: { accessToken: "tok_abc123", user: mockUser },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("is-init")).toHaveTextContent("false");
    });

    await user.click(screen.getByTestId("btn-login"));

    await waitFor(() => {
      expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
    });

    expect(mockPost).toHaveBeenCalledWith("/api/auth/login", {
      email: "test@test.com",
      password: "password123",
    });
    expect(authStore.accessToken).toBe("tok_abc123");

    // Tokens must NEVER be persisted to localStorage.
    expect(window.localStorage.length).toBe(0);
  });

  // -- logout() ------------------------------------------------------------

  it("logout calls POST /api/auth/logout and clears the store", async () => {
    // Pre-seed an authenticated session via the mount flow.
    mockGet.mockResolvedValueOnce({ data: mockUser });
    mockPost.mockResolvedValueOnce({ data: null });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
    });

    await user.click(screen.getByTestId("btn-logout"));

    await waitFor(() => {
      expect(screen.getByTestId("user-name")).toHaveTextContent("null");
    });

    expect(mockPost).toHaveBeenCalledWith("/api/auth/logout");
    expect(authStore.user).toBeNull();
    expect(authStore.accessToken).toBeNull();
  });

  it("logout clears store even when the API call fails", async () => {
    mockGet.mockResolvedValueOnce({ data: mockUser });
    mockPost.mockRejectedValueOnce(new Error("network"));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
    });

    await user.click(screen.getByTestId("btn-logout"));

    await waitFor(() => {
      expect(screen.getByTestId("user-name")).toHaveTextContent("null");
    });

    expect(authStore.user).toBeNull();
    expect(authStore.accessToken).toBeNull();
  });
});
