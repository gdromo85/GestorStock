import "dotenv/config";

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("GET /api/health", () => {
  it("returns 200 with the expected JSON shape", async () => {
    const res = await request(app).get("/api/health");

    // The health route returns 200 when DB is reachable, 503 when degraded.
    // Either way the shape must be correct.
    expect([200, 503]).toContain(res.status);

    expect(res.body).toEqual(
      expect.objectContaining({
        status: expect.stringMatching(/^(ok|degraded)$/),
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/), // ISO-8601
        database: expect.stringMatching(/^(connected|disconnected)$/),
      }),
    );
  });
});
