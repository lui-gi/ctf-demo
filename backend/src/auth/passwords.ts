import argon2 from 'argon2';

/**
 * Argon2id parameters tuned for player password hashing (slightly lighter than flag hashing,
 * since password verification happens on every login and we want sub-second response).
 *
 * Flag hashing uses heavier params (see services/validator.ts).
 */
const PASSWORD_ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024, // 19 MiB — OWASP-recommended minimum for argon2id passwords
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plaintext: string, pepper: string): Promise<string> {
  if (!plaintext || plaintext.length < 8) {
    throw new Error('password must be at least 8 chars');
  }
  return argon2.hash(plaintext + pepper, PASSWORD_ARGON_OPTS);
}

export async function verifyPassword(stored: string, plaintext: string, pepper: string): Promise<boolean> {
  try {
    return await argon2.verify(stored, plaintext + pepper);
  } catch {
    return false;
  }
}
