import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AccessTokenPayload {
  userId: string;
  role: string;
}

export interface DecodedAccessToken {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}

// ---------------------------------------------------------------------------
// Access Token (JWT — HS256, 15 min)
// ---------------------------------------------------------------------------

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): DecodedAccessToken {
  const decoded = jwt.verify(token, env.JWT_SECRET) as DecodedAccessToken;
  return decoded;
}

// ---------------------------------------------------------------------------
// Refresh Token (opaque UUID v4 — stored as SHA-256 hash in DB)
// ---------------------------------------------------------------------------

export function generateRefreshToken(): string {
  return randomUUID();
}
