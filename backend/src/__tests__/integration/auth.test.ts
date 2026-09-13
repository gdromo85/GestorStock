// ---------------------------------------------------------------------------
// Auth integration tests — require a reachable PostgreSQL (VPS).
// dotenv/config MUST be imported before any module that reads process.env.
// ---------------------------------------------------------------------------

import "dotenv/config";

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../config/database.js";

// ---------------------------------------------------------------------------
// DB connectivity gate (top-level await — runs before describe blocks)
// ---------------------------------------------------------------------------

let dbAvailable = false;

try {
  await prisma.$queryRaw`SELECT 1`;
  dbAvailable = true;
} catch {
  console.log(
    "⚠️  PostgreSQL unreachable — skipping auth integration tests",
  );
}

const suite = dbAvailable ? describe : describe.skip;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

/**
 * Perform a login and return the supertest response so callers can inspect
 * cookies, tokens, and user data.
 */
function loginAsAdmin() {
  return request(app)
    .post("/api/auth/login")
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

suite("Auth integration (PostgreSQL)", () => {
  // ---- POST /api/auth/login ------------------------------------------------

  describe("POST /api/auth/login", () => {
    it("returns 200 with accessToken and user on valid credentials", async () => {
      const res = await loginAsAdmin();

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            accessToken: expect.any(String),
            user: expect.objectContaining({
              id: expect.any(String),
              email: ADMIN_EMAIL,
              name: expect.any(String),
              role: expect.any(String),
              isActive: true,
            }),
          }),
        }),
      );
    });

    it("returns 401 on wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: ADMIN_EMAIL, password: "definitely-wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual(
        expect.objectContaining({ status: "error" }),
      );
    });

    it("returns 401 on nonexistent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@example.com", password: "somepassword" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual(
        expect.objectContaining({ status: "error" }),
      );
    });
  });

  // ---- GET /api/auth/me ----------------------------------------------------

  describe("GET /api/auth/me", () => {
    it("returns 401 without Authorization header", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body).toEqual(
        expect.objectContaining({ status: "error" }),
      );
    });

    it("returns 200 with user data when a valid Bearer token is provided", async () => {
      const loginRes = await loginAsAdmin();
      const { accessToken, user } = loginRes.body.data;

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            id: user.id,
            email: user.email,
          }),
        }),
      );
    });
  });

  // ---- POST /api/auth/refresh ----------------------------------------------

  describe("POST /api/auth/refresh", () => {
    it("returns 401 without refresh cookie", async () => {
      const res = await request(app).post("/api/auth/refresh");

      expect(res.status).toBe(401);
      expect(res.body).toEqual(
        expect.objectContaining({ status: "error" }),
      );
    });
  });

  // ---- POST /api/auth/logout -----------------------------------------------

  describe("POST /api/auth/logout", () => {
    it("returns 2xx and clears the refresh cookie", async () => {
      // Login first to obtain a valid refresh cookie
      const loginRes = await loginAsAdmin();
      const setCookie = loginRes.headers["set-cookie"] as string[] | undefined;
      expect(setCookie).toBeDefined();

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", setCookie!);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          status: "success",
          message: "Logged out successfully",
        }),
      );

      // The response must include a Set-Cookie header that clears the cookie
      const clearCookie = res.headers["set-cookie"] as string[] | undefined;
      expect(clearCookie).toBeDefined();
      const refreshTokenCookie = clearCookie!.find((c) =>
        c.startsWith("refreshToken="),
      );
      expect(refreshTokenCookie).toBeDefined();
    });
  });

  // ---- Rate limiting -------------------------------------------------------

  describe("Rate limiting", () => {
    // NOTE: The auth rate limiter allows 5 requests/minute/IP (in-memory).
    // Previous tests in this file already consumed 3 of those 5 slots.
    // We send 6 rapid bad-credential requests so that at least one hits 429.
    it("returns 429 after exceeding the login rate limit", async () => {
      const statuses: number[] = [];

      for (let i = 0; i < 6; i++) {
        const res = await request(app)
          .post("/api/auth/login")
          .send({ email: `bad${i}@test.com`, password: "wrongpassword" });
        statuses.push(res.status);
      }

      expect(statuses).toContain(429);
    }, 10_000);
  });
});
