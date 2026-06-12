// ---------------------------------------------------------------------------
// AuthContext — React bindings for the module-level AuthStore
// Provides login / logout / user to the component tree.
// ---------------------------------------------------------------------------

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { authStore, type User } from "./auth-store";
import { apiClient, ApiError } from "./api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Sync React state with the module-level store
  const state = useSyncExternalStore(
    (cb) => authStore.subscribe(cb),
    () => authStore.user,
    () => authStore.user,
  );

  const [isInitializing, setIsInitializing] = useState(true);

  // Attempt session restore on mount (refresh cookie → access token → /me)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { data } = await apiClient.get<User>("/api/auth/me");
        if (!cancelled) {
          authStore.setAuth(data, authStore.accessToken!);
        }
      } catch {
        // No valid session — that's fine, user sees login page
      } finally {
        if (!cancelled) {
          authStore.markInitialized();
          setIsInitializing(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // -- Actions --------------------------------------------------------------

  async function login(email: string, password: string): Promise<void> {
    const { data } = await apiClient.post<{ accessToken: string; user: User }>(
      "/api/auth/login",
      { email, password },
    );

    authStore.setAuth(data.user, data.accessToken);
  }

  async function logout(): Promise<void> {
    try {
      await apiClient.post("/api/auth/logout");
    } catch {
      // Ignore logout API errors — clear local state regardless
    } finally {
      authStore.clearAuth();
    }
  }

  // -- Render ---------------------------------------------------------------

  const value: AuthContextValue = {
    user: state,
    isAuthenticated: authStore.isAuthenticated,
    isInitializing,
    login,
    logout,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
