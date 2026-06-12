import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { ValidationError } from "../utils/errors.js";

/**
 * Validates `req.body` against a Zod schema.
 * On success, replaces `req.body` with the parsed (coerced) value.
 * On failure, throws a ValidationError with per-field details.
 */
export function validate(
  schema: ZodType,
): (req: Request, _res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return next(new ValidationError("Validation failed", details));
    }

    req.body = result.data;
    next();
  };
}

export { ValidationError };
