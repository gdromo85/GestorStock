import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate, useSearch, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { useAuth } from "~/lib/auth-context";
import { authStore } from "~/lib/auth-store";
import { ApiError } from "~/lib/api-client";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

const loginSearchSchema = z.object({
  redirect: z.string().optional().default("/dashboard"),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ search }) => {
    // Server (SSR): the session lives only in client memory, so skip the check.
    if (typeof document === "undefined") return;

    // Client: already signed in — skip the form and go straight to the app
    await authStore.initialized;
    if (authStore.isAuthenticated) {
      throw redirect({ to: search.redirect });
    }
  },
  component: LoginPage,
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().min(1, "Ingresá tu correo electrónico").email("El formato del correo no es válido"),
  password: z.string().min(1, "Ingresá tu contraseña").min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type FormErrors = Partial<Record<"email" | "password" | "form", string>>;

const ADMIN_CONTACT_URL = "https://wa.me/5493513673578";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FormErrors {
    const result = loginSchema.safeParse({ email, password });
    if (result.success) return {};

    const fieldErrors: FormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as "email" | "password";
      if (!fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return fieldErrors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate({ to: redirect });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ form: err.message });
      } else {
        setErrors({ form: "Error de conexión. Verificá tu internet e intentá de nuevo." });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-2">
        <img
          src="/logo-argojardin.png"
          alt="Argojardín"
          width={96}
          height={96}
          className="h-24 w-24 object-contain"
        />
        <h1 className="text-2xl font-bold text-primary-700">GestorStock</h1>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-6 text-center text-xl font-semibold text-text-primary">
          Iniciar sesión
        </h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {errors.form && (
            <div
              className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
              role="alert"
            >
              {errors.form}
            </div>
          )}

          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />

          <Input
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="flex h-full w-11 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <path d="M9.88 9.88a3 3 0 104.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0112 5c7 0 10 7 10 7a13.16 13.16 0 01-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 002 12s3 7 10 7a9.74 9.74 0 005.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            }
          />

          <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
            Iniciar sesión
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-text-secondary">
          ¿Olvidaste tu contraseña?{" "}
          <a
            href={ADMIN_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary-700 underline underline-offset-2 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            Contactá al administrador
          </a>
        </p>
      </div>
    </div>
  );
}
