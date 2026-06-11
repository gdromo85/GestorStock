import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { env } from "./config/env.js";
import healthRouter from "./routes/health.js";
import { AppError, ValidationError } from "./utils/errors.js";
import { sendError } from "./utils/response.js";
import type { Request, Response, NextFunction } from "express";

const app = express();

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(compression());

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use("/api/health", healthRouter);

// Future routes will be mounted here:
// app.use("/api/auth", authRouter);
// app.use("/api/users", usersRouter);

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError("Route not found", 404));
});

// ---------------------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------------------
app.use(
  (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    // Known operational errors
    if (err instanceof ValidationError) {
      sendError(res, err.message, err.statusCode, err.details);
      return;
    }

    if (err instanceof AppError) {
      sendError(res, err.message, err.statusCode);
      return;
    }

    // Unexpected errors — log and hide details in production
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);

    const message =
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message;

    sendError(res, message, 500);
  },
);

export default app;
