import rateLimit from "express-rate-limit";

// ---------------------------------------------------------------------------
// POST /api/auth/login — 5 requests per minute per IP
// ---------------------------------------------------------------------------

export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many login attempts, try again later" },
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh — 30 requests per minute per IP
// ---------------------------------------------------------------------------

export const refreshRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many refresh attempts, try again later" },
});
