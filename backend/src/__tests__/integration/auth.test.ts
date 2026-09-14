// ---------------------------------------------------------------------------
// Auth integration tests — require a reachable PostgreSQL (VPS).
// dotenv/config MUST be imported before any module that reads process.env.
// ---------------------------------------------------------------------------

import "dotenv/config";

import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../config/database.js";
import { generateRefreshToken } from "../../lib/jwt.js";

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
    const COOKIE_NAME = "refreshToken";

    it("returns 401 without refresh cookie", async () => {
      const res = await request(app).post("/api/auth/refresh");

      expect(res.status).toBe(401);
      expect(res.body).toEqual(
        expect.objectContaining({ status: "error" }),
      );
    });

    it("returns 200 with new accessToken and rotated refresh cookie on valid refresh", async () => {
      // Create a valid refresh token directly via Prisma (avoids login rate limiter)
      const adminUser = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
      });
      expect(adminUser).toBeTruthy();

      const rawToken = generateRefreshToken();
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");

      await prisma.refreshToken.create({
        data: {
          tokenHash,
          userId: adminUser!.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", `${COOKIE_NAME}=${rawToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          status: "success",
          data: expect.objectContaining({
            accessToken: expect.any(String),
          }),
        }),
      );

      // Response must include a Set-Cookie header with a new refresh token
      const newCookie = res.headers["set-cookie"] as string[] | undefined;
      expect(newCookie).toBeDefined();
      const refreshTokenCookie = newCookie!.find((c) =>
        c.startsWith(`${COOKIE_NAME}=`),
      );
      expect(refreshTokenCookie).toBeDefined();
    });

    it("returns 401 for expired refresh token", async () => {
      // Generate a token, hash it, and insert a row with past expiresAt
      const rawToken = generateRefreshToken();
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");

      const adminUser = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
      });
      expect(adminUser).toBeTruthy();

      await prisma.refreshToken.create({
        data: {
          tokenHash,
          userId: adminUser!.id,
          expiresAt: new Date("2020-01-01T00:00:00.000Z"),
        },
      });

      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", `${COOKIE_NAME}=${rawToken}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual(
        expect.objectContaining({ status: "error" }),
      );

      // The expired token should have been revoked
      const stored = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });
      expect(stored?.revokedAt).not.toBeNull();
    });

    it("detects replay and revokes the entire token family", async () => {
      // Create a valid refresh token directly via Prisma (avoids login rate limiter)
      const adminUser = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
      });
      expect(adminUser).toBeTruthy();

      const rawToken = generateRefreshToken();
      const tokenHash = createHash("sha256").update(rawToken).digest("hex");

      await prisma.refreshToken.create({
        data: {
          tokenHash,
          userId: adminUser!.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // First use — should succeed (200)
      const firstRes = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", `${COOKIE_NAME}=${rawToken}`);

      expect(firstRes.status).toBe(200);

      // Second use with the SAME old token — should fail (replay)
      const secondRes = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", `${COOKIE_NAME}=${rawToken}`);

      expect(secondRes.status).toBe(401);
      expect(secondRes.body).toEqual(
        expect.objectContaining({ status: "error" }),
      );

      // Verify: all refresh tokens for this user should now be revoked
      const tokens = await prisma.refreshToken.findMany({
        where: { userId: adminUser!.id },
      });
      expect(tokens.length).toBeGreaterThan(0);
      for (const token of tokens) {
        expect(token.revokedAt).not.toBeNull();
      }
    });

    it("returns 401 for malformed refresh token", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", `${COOKIE_NAME}=this-is-not-a-valid-token`);

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
