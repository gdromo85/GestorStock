import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../lib/password.js";

describe("hashPassword / verifyPassword", () => {
  it("hash + compare roundtrip works", async () => {
    const plain = "mySecurePassword123!";
    const hashed = await hashPassword(plain);

    const result = await verifyPassword(plain, hashed);
    expect(result).toBe(true);
  });

  it("wrong password fails compare", async () => {
    const plain = "mySecurePassword123!";
    const hashed = await hashPassword(plain);

    const result = await verifyPassword("wrongPassword!", hashed);
    expect(result).toBe(false);
  });

  it("hash output differs from plaintext", async () => {
    const plain = "mySecurePassword123!";
    const hashed = await hashPassword(plain);

    expect(hashed).not.toBe(plain);
    // bcrypt hashes start with $2b$ (or $2a$) followed by cost rounds
    expect(hashed).toMatch(/^\$2[ab]\$\d{2}\$/);
  });
});
