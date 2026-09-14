import { prisma } from "../config/database.js";
import { hashPassword } from "../lib/password.js";
import { ConflictError } from "../utils/errors.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role: string;
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

function stripPassword<T extends { passwordHash: string }>(
  user: T,
): Omit<T, "passwordHash"> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

async function createUser(input: CreateUserInput): Promise<SafeUser> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new ConflictError("A user with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
      role: input.role as "ADMIN" | "MANAGER" | "MECHANIC",
    },
  });

  return stripPassword(user);
}

export const userService = { createUser };
