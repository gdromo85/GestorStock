import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const VALID_ENV = {
  DATABASE_URL: "postgres://localhost:5432/test",
  JWT_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
} as const;

// Helpers ----------------------------------------------------------------

/** Remove all env keys that env.ts validates, then apply overrides. */
function setEnv(overrides: Record<string, string | undefined>) {
  for (const key of Object.keys(VALID_ENV)) delete process.env[key];
  delete process.env.NODE_ENV;
  delete process.env.PORT;
  delete process.env.CORS_ORIGIN;
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_NAME;

  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

// Tests ------------------------------------------------------------------

describe("env — valid configurations", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("accepts a postgres:// DATABASE_URL", async () => {
    setEnv(VALID_ENV);
    const { env } = await import("../config/env.js");
    expect(env.DATABASE_URL).toBe("postgres://localhost:5432/test");
    expect(env.JWT_SECRET).toHaveLength(32);
    expect(env.JWT_REFRESH_SECRET).toHaveLength(32);
  });

  it("accepts a postgresql:// DATABASE_URL", async () => {
    setEnv({ ...VALID_ENV, DATABASE_URL: "postgresql://localhost:5432/test" });
    const { env } = await import("../config/env.js");
    expect(env.DATABASE_URL).toBe("postgresql://localhost:5432/test");
  });
});

describe("env — missing or invalid values abort startup", () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("exits and throws when DATABASE_URL is missing", async () => {
    setEnv({ JWT_SECRET: VALID_ENV.JWT_SECRET, JWT_REFRESH_SECRET: VALID_ENV.JWT_REFRESH_SECRET });
    await expect(import("../config/env.js")).rejects.toThrow(
      "Environment validation failed",
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("exits and throws when JWT_SECRET is missing", async () => {
    setEnv({ DATABASE_URL: VALID_ENV.DATABASE_URL, JWT_REFRESH_SECRET: VALID_ENV.JWT_REFRESH_SECRET });
    await expect(import("../config/env.js")).rejects.toThrow(
      "Environment validation failed",
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("exits and throws when JWT_SECRET is shorter than 32 chars", async () => {
    setEnv({ ...VALID_ENV, JWT_SECRET: "short" });
    await expect(import("../config/env.js")).rejects.toThrow(
      "Environment validation failed",
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("exits and throws when JWT_REFRESH_SECRET is shorter than 32 chars", async () => {
    setEnv({ ...VALID_ENV, JWT_REFRESH_SECRET: "short" });
    await expect(import("../config/env.js")).rejects.toThrow(
      "Environment validation failed",
    );

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});
