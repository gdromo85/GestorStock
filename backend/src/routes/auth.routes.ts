import { Router, type Request, type Response, type NextFunction } from "express";
import { authService } from "../services/auth.service.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { validate } from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { sendSuccess } from "../utils/response.js";
import { UnauthorizedError } from "../utils/errors.js";
import { env } from "../config/env.js";
import type { LoginInput } from "../schemas/auth.schema.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COOKIE_NAME = "refreshToken";
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as LoginInput;
      const result = await authService.login(email, password);

      setRefreshCookie(res, result.refreshToken);

      sendSuccess(res, {
        accessToken: result.accessToken,
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------

router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.[COOKIE_NAME] as string | undefined;

      if (!token) {
        throw new UnauthorizedError("Missing refresh token");
      }

      const result = await authService.refresh(token);

      setRefreshCookie(res, result.refreshToken);

      sendSuccess(res, { accessToken: result.accessToken });
    } catch (error) {
      next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

router.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.cookies?.[COOKIE_NAME] as string | undefined;

      if (token) {
        await authService.logout(token);
      }

      clearRefreshCookie(res);

      sendSuccess(res, null, "Logged out successfully");
    } catch (error) {
      next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// GET /api/auth/me  (protected)
// ---------------------------------------------------------------------------

router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  },
);

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: "/api/auth",
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });
}

export default router;
