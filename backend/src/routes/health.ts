import { Router, type Request, type Response } from "express";
import { checkDatabaseConnection } from "../config/database.js";

const router = Router();

interface HealthResponse {
  status: "ok" | "degraded";
  timestamp: string;
  database: "connected" | "disconnected";
}

router.get("/", async (_req: Request, res: Response): Promise<void> => {
  const dbConnected = await checkDatabaseConnection();

  const body: HealthResponse = {
    status: dbConnected ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    database: dbConnected ? "connected" : "disconnected",
  };

  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json(body);
});

export default router;
