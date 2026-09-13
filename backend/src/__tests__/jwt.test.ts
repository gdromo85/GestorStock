import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";

// jwt.ts imports env.ts which validates at import time.
// vi.hoisted runs before import hoisting, so env is set when env.ts loads.
vi.hoisted(() => {
  process.env.DATABASE_URL = "postgres://localhost:5432/test";
  process.env.JWT_SECRET = "a".repeat(32);
  process.env.JWT_REFRESH_SECRET = "b".repeat(32);
});

import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
} from "../lib/jwt.js";

// ---------------------------------------------------------------------------
// Access Token (JWT — HS256, 15 min)
// ---------------------------------------------------------------------------

describe("access token", () => {
  it("sign + verify roundtrip preserves claims", () => {
    const payload = { userId: "usr_abc123", role: "admin" };
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe("usr_abc123");
    expect(decoded.role).toBe("admin");
    expect(decoded.iat).toBeTypeOf("number");
    expect(decoded.exp).toBeTypeOf("number");
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  it("expired token fails verify", () => {
    const payload = { userId: "usr_abc123", role: "admin" };
    // expiresIn "0s" creates a token that is already expired
    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "0s" });

    expect(() => verifyAccessToken(token)).toThrow();
  });

  it("malformed token fails verify", () => {
    expect(() => verifyAccessToken("not.a.valid.jwt")).toThrow();
  });

  it("token signed with wrong secret fails verify", () => {
    const payload = { userId: "usr_abc123", role: "admin" };
    const token = jwt.sign(payload, "completely-wrong-secret-value-here!!");

    expect(() => verifyAccessToken(token)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Refresh Token (opaque UUID v4 — not a JWT)
// ---------------------------------------------------------------------------

describe("refresh token", () => {
  it("generates a valid UUID v4", () => {
    const token = generateRefreshToken();
    const uuidV4 =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(token).toMatch(uuidV4);
  });

  it("generates unique values on each call", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
  });
});
