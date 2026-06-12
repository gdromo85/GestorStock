import { cn } from "~/lib/cn";

// ---------------------------------------------------------------------------
// Button — reusable button with variants
// ---------------------------------------------------------------------------

const VARIANTS = {
  primary: "bg-primary-600 text-text-inverse hover:bg-primary-700 active:bg-primary-800",
  secondary: "bg-surface-dim text-text-primary border border-border hover:bg-border active:bg-border-strong",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-dim active:bg-border",
  danger: "bg-danger text-text-inverse hover:opacity-90 active:opacity-80",
} as const;

type Variant = keyof typeof VARIANTS;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex min-h-touch items-center justify-center rounded-lg px-4 py-3 text-base font-medium transition-colors",
        VARIANTS[variant],
        (disabled || loading) && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
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
          Loading…
        </span>
      ) : (
        children
      )}
    </button>
  );
}
