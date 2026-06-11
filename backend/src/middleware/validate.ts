import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "../utils/errors.js";

/**
 * Placeholder for Zod validation middleware.
 * Will be used in Phase 2 for auth request validation.
 *
 * Usage:
 *   import { z } from "zod";
 *   const loginSchema = z.object({ body: z.object({ email: z.string().email() }) });
 *   router.post("/login", validate(loginSchema), handler);
 */
export function validate(
  _schema: unknown,
): (req: Request, res: Response, next: NextFunction) => void {
  return (_req: Request, _res: Response, next: NextFunction) => {
    // Phase 2 will implement actual Zod parsing here.
    // For Phase 1, pass through.
    next();
  };
}

export { ValidationError };
