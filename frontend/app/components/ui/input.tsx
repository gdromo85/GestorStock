import { cn } from "~/lib/cn";

// ---------------------------------------------------------------------------
// Input — form input with label + inline error + optional trailing element
// ---------------------------------------------------------------------------

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Optional element rendered inside the field (e.g. a password visibility toggle). */
  trailing?: React.ReactNode;
}

export function Input({ label, error, trailing, id, className, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            "min-h-touch w-full rounded-lg border bg-surface px-4 py-3 text-base text-text-primary outline-none transition-colors",
            "placeholder:text-text-secondary",
            "focus:border-primary-600 focus:ring-2 focus:ring-primary-600",
            trailing && "pr-12",
            error
              ? "border-danger focus:border-danger focus:ring-danger"
              : "border-border",
            className,
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {trailing}
          </div>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
