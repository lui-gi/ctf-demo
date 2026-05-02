import { z } from 'zod';

/**
 * Environment configuration for the progctf backend.
 * Validated with zod on boot — process exits if invalid.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),

  DB_URL: z.string().url().or(z.string().startsWith('postgres://')).or(z.string().startsWith('postgresql://')),
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')).or(z.string().startsWith('rediss://')),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  ARGON2_PEPPER: z.string().min(16, 'ARGON2_PEPPER must be at least 16 chars'),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  COOKIE_DOMAIN: z.string().default('localhost'),
  COOKIE_SECURE: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  SANDBOX_CONTROLLER_URL: z.string().default('http://localhost:8080'),
  SANDBOX_CONTROLLER_TOKEN: z.string().default('dev-token'),
  /** Per-Island shell session idle timeout (seconds). Default 5 min — spec §9. */
  SHELL_IDLE_TIMEOUT_SECS: z.coerce.number().int().positive().default(300),

  CHARTS_CACHE_TTL: z.coerce.number().int().positive().default(5),
  SUBMIT_RATE_PER_MIN: z.coerce.number().int().positive().default(5),
  AUTH_RATE_PER_MIN: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment config:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

/** Reset cached env — only used by tests. */
export function _resetEnvCache(): void {
  cached = null;
}

export function corsOrigins(env: Env): string[] {
  return env.CORS_ORIGINS.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
