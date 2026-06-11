import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-bold text-primary-700">GestorStock</h1>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-center text-xl font-semibold text-text-primary">
          Sign In
        </h2>
        <p className="text-center text-sm text-text-secondary">
          Login form will be implemented in Phase 3.
        </p>
      </div>
    </div>
  );
}
