import { createFileRoute, redirect } from "@tanstack/react-router";

// ---------------------------------------------------------------------------
// Route — "/" is an interstitial nobody needs: send it straight to login.
// The login route redirects authenticated users to /dashboard.
// ---------------------------------------------------------------------------

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
});
