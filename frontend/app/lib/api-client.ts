// ---------------------------------------------------------------------------
// API Client — fetch wrapper with automatic token refresh on 401
// ---------------------------------------------------------------------------

import { authStore } from "./auth-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  status: "success";
  data: T;
  message?: string;
}

export interface ApiErrorBody {
  status: "error";
  message: string;
  details?: Array<{ field: string; message: string }>;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

let refreshPromise: Promise<string> | null = null;

/**
 * Call POST /api/auth/refresh. The httpOnly cookie is sent automatically.
 * Concurrent 401s share a single refresh call to avoid token race conditions.
 */
async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Refresh failed");
      }

      const json: ApiResponse<{ accessToken: string }> = await res.json();
      const newToken = json.data.accessToken;

      authStore.setAccessToken(newToken);
      return newToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Core fetch
// ---------------------------------------------------------------------------

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = authStore.accessToken;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 401 → attempt one refresh + retry
  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      headers["Authorization"] = `Bearer ${newToken}`;

      const retryRes = await fetch(url, {
        method,
        headers,
        credentials: "include",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (retryRes.status === 401) {
        authStore.clearAuth();
        throw new ApiError(401, { status: "error", message: "Session expired" });
      }

      return parseResponse<T>(retryRes);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      authStore.clearAuth();
      throw new ApiError(401, { status: "error", message: "Session expired" });
    }
  }

  return parseResponse<T>(res);
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorBody: ApiErrorBody;
    try {
      errorBody = (await res.json()) as ApiErrorBody;
    } catch {
      errorBody = {
        status: "error",
        message: `Request failed with status ${res.status}`,
      };
    }
    throw new ApiError(res.status, errorBody);
  }

  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const apiClient = {
  get: <T>(url: string) => request<ApiResponse<T>>("GET", url),
  post: <T>(url: string, body?: unknown) =>
    request<ApiResponse<T>>("POST", url, body),
  put: <T>(url: string, body?: unknown) =>
    request<ApiResponse<T>>("PUT", url, body),
  patch: <T>(url: string, body?: unknown) =>
    request<ApiResponse<T>>("PATCH", url, body),
  delete: <T>(url: string) => request<ApiResponse<T>>("DELETE", url),
};
