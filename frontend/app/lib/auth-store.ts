// ---------------------------------------------------------------------------
// Auth Store — module-level singleton for cross-cutting auth state
// Accessible by both React components (via AuthContext) and the router
// (via beforeLoad context). Never persist tokens to localStorage.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type Listener = () => void;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

class AuthStore {
  private _user: User | null = null;
  private _accessToken: string | null = null;
  private _initialized = false;
  private _initPromise: Promise<void>;
  private _resolveInit!: () => void;
  private listeners = new Set<Listener>();

  constructor() {
    this._initPromise = new Promise<void>((resolve) => {
      this._resolveInit = resolve;
    });
  }

  // -- Getters --------------------------------------------------------------

  get isAuthenticated(): boolean {
    return this._accessToken !== null;
  }

  get user(): User | null {
    return this._user;
  }

  get accessToken(): string | null {
    return this._accessToken;
  }

  /** Resolves once the initial session restore attempt finishes. */
  get initialized(): Promise<void> {
    return this._initPromise;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  // -- Mutations ------------------------------------------------------------

  setAuth(user: User, accessToken: string): void {
    this._user = user;
    this._accessToken = accessToken;
    this.notify();
  }

  setAccessToken(token: string): void {
    this._accessToken = token;
    this.notify();
  }

  clearAuth(): void {
    this._user = null;
    this._accessToken = null;
    this.notify();
  }

  markInitialized(): void {
    if (!this._initialized) {
      this._initialized = true;
      this._resolveInit();
    }
  }

  // -- Subscription (for React binding) -------------------------------------

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // -- Internal -------------------------------------------------------------

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/** Singleton — import this everywhere auth state is needed. */
export const authStore = new AuthStore();
