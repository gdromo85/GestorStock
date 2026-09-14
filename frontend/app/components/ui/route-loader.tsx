// ---------------------------------------------------------------------------
// RouteLoader — centered loading indicator shown during route transitions
// ---------------------------------------------------------------------------

export function RouteLoader() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-busy="true"
    >
      <span className="inline-flex items-center gap-2 text-text-secondary">
        <svg
          className="h-5 w-5 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        Cargando…
      </span>
    </div>
  );
}
