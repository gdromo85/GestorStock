import { Router, type Request, type Response, type NextFunction } from "express";
import { userService } from "../services/user.service.js";
import { createUserSchema } from "../schemas/auth.schema.js";
import { validate } from "../middleware/validate.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { sendSuccess } from "../utils/response.js";
import type { CreateUserInput } from "../schemas/auth.schema.js";

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const router = Router();

// ---------------------------------------------------------------------------
// POST /api/users  (admin-only)
// ---------------------------------------------------------------------------

router.post(
  "/",
  authenticateToken,
  requireRole("ADMIN"),
  validate(createUserSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as CreateUserInput;
      const user = await userService.createUser(input);
      sendSuccess(res, user, undefined, 201);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
