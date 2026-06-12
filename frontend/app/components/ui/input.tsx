import { cn } from "~/lib/cn";

// ---------------------------------------------------------------------------
// Input — form input with label + inline error
// ---------------------------------------------------------------------------

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-text-primary"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "min-h-touch w-full rounded-lg border bg-surface px-4 py-3 text-base text-text-primary outline-none transition-colors",
          "placeholder:text-text-secondary/60",
          "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
          error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-border",
          className,
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
