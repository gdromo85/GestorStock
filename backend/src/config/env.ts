import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().url().default("http://localhost:3000"),

  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//, "must start with postgres:// or postgresql://"),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NAME: z.string().min(2).optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Environment validation failed:");
    for (const issue of result.error.issues) {
      console.error(`   ${issue.path.join(".")}: ${issue.message}`);
    }
    // process.exit is not reliable in every runtime (workers, test harnesses);
    // throwing guarantees the module never exports a partially-validated env.
    process.exit(1);
    throw new Error("Environment validation failed");
  }

  return result.data;
}

export const env = validateEnv();
