// ---------------------------------------------------------------------------
// POST /api/users integration tests — require a reachable PostgreSQL (VPS).
// dotenv/config MUST be imported before any module that reads process.env.
// ---------------------------------------------------------------------------

import "dotenv/config";

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { hash } from "bcrypt";
import request from "supertest";
import app from "../../app.js";
import { prisma } from "../../config/database.js";
import { signAccessToken } from "../../lib/jwt.js";

// ---------------------------------------------------------------------------
// DB connectivity gate
// ---------------------------------------------------------------------------

let dbAvailable = false;

try {
  await prisma.$queryRaw`SELECT 1`;
  dbAvailable = true;
} catch {
  console.log(
    "⚠️  PostgreSQL unreachable — skipping users integration tests",
  );
}

const suite = dbAvailable ? describe : describe.skip;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;
const TEST_EMAIL = `test-user-${Date.now()}@example.com`;
const TEST_PASSWORD = "testpassword123";

/**
 * Insert a MECHANIC user directly via Prisma (bypasses login rate limiter)
 * and return a signed access token for that user.
 */
async function createMechanicToken(): Promise<string> {
  const passwordHash = await hash(TEST_PASSWORD, 12);
  const user = await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      name: "Test Mechanic",
      passwordHash,
      role: "MECHANIC",
    },
  });
  return signAccessToken({ userId: user.id, role: user.role });
}

/**
 * Find the seeded admin user and return a signed access token.
 */
async function getAdminToken(): Promise<string> {
  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: ADMIN_EMAIL },
  });
  return signAccessToken({ userId: admin.id, role: admin.role });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

suite("POST /api/users integration (PostgreSQL)", () => {
  let adminToken: string;
  let mechanicToken: string;
  let createdUserId: string;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    mechanicToken = await createMechanicToken();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    if (createdUserId) {
      await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
    }
  });

  // ---- POST /api/users -----------------------------------------------------

  it("creates a user and returns 201 (admin token)", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: `created-${Date.now()}@example.com`,
        name: "New User",
        password: "securepassword123",
        role: "MECHANIC",
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        status: "success",
        data: expect.objectContaining({
          id: expect.any(String),
          email: expect.any(String),
          name: "New User",
          role: "MECHANIC",
          isActive: true,
        }),
      }),
    );
    // Must NOT include passwordHash
    expect(res.body.data.passwordHash).toBeUndefined();
    createdUserId = res.body.data.id;
  });

  it("returns 403 for non-admin token", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${mechanicToken}`)
      .send({
        email: `should-not-create-${Date.now()}@example.com`,
        name: "Should Not Create",
        password: "securepassword123",
        role: "MECHANIC",
      });

    expect(res.status).toBe(403);
    expect(res.body).toEqual(
      expect.objectContaining({ status: "error" }),
    );
  });

  it("returns 401 without Authorization header", async () => {
    const res = await request(app)
      .post("/api/users")
      .send({
        email: `should-not-create-${Date.now()}@example.com`,
        name: "Should Not Create",
        password: "securepassword123",
        role: "MECHANIC",
      });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(
      expect.objectContaining({ status: "error" }),
    );
  });

  it("returns 409 for duplicate email", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: ADMIN_EMAIL, // Already exists (seeded admin)
        name: "Duplicate Admin",
        password: "securepassword123",
        role: "ADMIN",
      });

    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({ status: "error" }),
    );
  });

  it("returns 400 for weak password (min 8 chars)", async () => {
    const res = await request(app)
      .post("/api/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: `weak-pw-${Date.now()}@example.com`,
        name: "Weak PW User",
        password: "short",
        role: "MECHANIC",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({ status: "error" }),
    );
  });
});
