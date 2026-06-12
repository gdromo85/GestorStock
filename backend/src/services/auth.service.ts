import { createHash } from "node:crypto";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import {
  signAccessToken,
  generateRefreshToken,
} from "../lib/jwt.js";
import { verifyPassword } from "../lib/password.js";
import { UnauthorizedError } from "../utils/errors.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const REFRESH_TOKEN_DAYS = 7;

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: SafeUser;
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function stripPassword<T extends { passwordHash: string }>(
  user: T,
): Omit<T, "passwordHash"> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

function refreshExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

async function login(email: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const rawRefresh = generateRefreshToken();
  const tokenHash = hashToken(rawRefresh);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: refreshExpiry(),
    },
  });

  return {
    accessToken,
    refreshToken: rawRefresh,
    user: stripPassword(user),
  };
}

async function refresh(rawToken: string): Promise<RefreshResult> {
  const tokenHash = hashToken(rawToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  // Token not found → invalid
  if (!stored) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  // Family revocation: if a revoked token is being reused, revoke ALL tokens
  if (stored.revokedAt !== null) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError("Invalid refresh token");
  }

  // Expired token → revoke it and reject
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError("Refresh token expired");
  }

  // Inactive user
  if (!stored.user.isActive) {
    throw new UnauthorizedError("User account is disabled");
  }

  // Rotate: revoke old token, issue new pair
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const newRawRefresh = generateRefreshToken();
  const newHash = hashToken(newRawRefresh);

  await prisma.refreshToken.create({
    data: {
      tokenHash: newHash,
      userId: stored.userId,
      expiresAt: refreshExpiry(),
    },
  });

  const accessToken = signAccessToken({
    userId: stored.userId,
    role: stored.user.role,
  });

  return {
    accessToken,
    refreshToken: newRawRefresh,
  };
}

async function logout(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);

  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
}

async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.isActive) {
    throw new UnauthorizedError("User not found");
  }

  return stripPassword(user);
}

export const authService = {
  login,
  refresh: refreshToken,
  logout,
  getCurrentUser,
};
