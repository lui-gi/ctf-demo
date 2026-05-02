import { describe, it, expect } from 'vitest';
import {
  FLAG_REGEX,
  hashFlag,
  verifyFlag,
  checkSubmitRateLimit,
  VALIDATOR_MESSAGES,
} from '../src/services/validator.js';

const PEPPER = 'unit-test-pepper-1234567890abcdef';

describe('validator — regex', () => {
  it('accepts canonical flag shape', () => {
    expect(FLAG_REGEX.test('progctf{kraken_woke}')).toBe(true);
    expect(FLAG_REGEX.test('progctf{a_b_c_123}')).toBe(true);
    expect(FLAG_REGEX.test('progctf{a}')).toBe(true);
  });

  it('rejects empty body', () => {
    expect(FLAG_REGEX.test('progctf{}')).toBe(false);
  });

  it('rejects uppercase', () => {
    expect(FLAG_REGEX.test('progctf{KrAkEn}')).toBe(false);
  });

  it('rejects wrong prefix', () => {
    expect(FLAG_REGEX.test('flag{kraken}')).toBe(false);
    expect(FLAG_REGEX.test('PROGCTF{kraken}')).toBe(false);
  });

  it('rejects punctuation in body', () => {
    expect(FLAG_REGEX.test('progctf{kraken-woke}')).toBe(false);
    expect(FLAG_REGEX.test('progctf{kraken woke}')).toBe(false);
    expect(FLAG_REGEX.test('progctf{kraken!}')).toBe(false);
  });

  it('rejects unbalanced braces', () => {
    expect(FLAG_REGEX.test('progctf{kraken')).toBe(false);
    expect(FLAG_REGEX.test('progctfkraken}')).toBe(false);
  });
});

describe('validator — hashFlag / verifyFlag', () => {
  it('hashFlag refuses malformed flags', async () => {
    await expect(hashFlag('not_a_flag', PEPPER)).rejects.toThrow();
  });

  it('hashFlag produces argon2id hash', async () => {
    const h = await hashFlag('progctf{deep_water}', PEPPER);
    expect(h.startsWith('$argon2id$')).toBe(true);
  }, 30_000);

  it('verifyFlag returns true for matching flag (constant-time guarded)', async () => {
    const h = await hashFlag('progctf{deep_water}', PEPPER);
    const ok = await verifyFlag(h, 'progctf{deep_water}', PEPPER);
    expect(ok).toBe(true);
  }, 30_000);

  it('verifyFlag returns false for wrong flag', async () => {
    const h = await hashFlag('progctf{deep_water}', PEPPER);
    const ok = await verifyFlag(h, 'progctf{wrong_one}', PEPPER);
    expect(ok).toBe(false);
  }, 30_000);

  it('verifyFlag returns false for wrong pepper', async () => {
    const h = await hashFlag('progctf{deep_water}', PEPPER);
    const ok = await verifyFlag(h, 'progctf{deep_water}', 'different-pepper-456789');
    expect(ok).toBe(false);
  }, 30_000);
});

/* ----------------------------- Mock redis client ----------------------------- */

class FakeRedis {
  private data = new Map<string, number>();
  private ttls = new Map<string, number>();
  async incr(key: string): Promise<number> {
    const next = (this.data.get(key) ?? 0) + 1;
    this.data.set(key, next);
    return next;
  }
  async expire(key: string, sec: number): Promise<number> {
    this.ttls.set(key, sec);
    return 1;
  }
  async ttl(key: string): Promise<number> {
    return this.ttls.get(key) ?? -1;
  }
}

describe('validator — checkSubmitRateLimit', () => {
  it('allows up to N requests, blocks N+1, returns Retry-After', async () => {
    const r = new FakeRedis() as unknown as Parameters<typeof checkSubmitRateLimit>[0];
    const crew = 'crew-uuid';
    const isl = 'island-uuid';
    for (let i = 0; i < 5; i++) {
      const res = await checkSubmitRateLimit(r, crew, isl, 5);
      expect(res.allowed).toBe(true);
    }
    const res6 = await checkSubmitRateLimit(r, crew, isl, 5);
    expect(res6.allowed).toBe(false);
    expect(res6.retryAfter).toBeGreaterThan(0);
    expect(res6.retryAfter).toBeLessThanOrEqual(60);
  });

  it('isolates per crew', async () => {
    const r = new FakeRedis() as unknown as Parameters<typeof checkSubmitRateLimit>[0];
    const isl = 'island-uuid';
    for (let i = 0; i < 5; i++) {
      await checkSubmitRateLimit(r, 'crew-a', isl, 5);
    }
    const aBlocked = await checkSubmitRateLimit(r, 'crew-a', isl, 5);
    expect(aBlocked.allowed).toBe(false);
    const bAllowed = await checkSubmitRateLimit(r, 'crew-b', isl, 5);
    expect(bAllowed.allowed).toBe(true);
  });

  it('isolates per island', async () => {
    const r = new FakeRedis() as unknown as Parameters<typeof checkSubmitRateLimit>[0];
    const crew = 'crew-uuid';
    for (let i = 0; i < 5; i++) {
      await checkSubmitRateLimit(r, crew, 'island-1', 5);
    }
    const blocked = await checkSubmitRateLimit(r, crew, 'island-1', 5);
    expect(blocked.allowed).toBe(false);
    const fresh = await checkSubmitRateLimit(r, crew, 'island-2', 5);
    expect(fresh.allowed).toBe(true);
  });
});

describe('validator — themed error messages', () => {
  it('every error code has a themed message', () => {
    for (const [code, msg] of Object.entries(VALIDATOR_MESSAGES)) {
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
      expect(code.startsWith('ERR_')).toBe(true);
    }
  });

  it('wrong-treasure message uses the canonical pirate phrasing', () => {
    expect(VALIDATOR_MESSAGES.ERR_WRONG_TREASURE).toMatch(/right Treasure/);
  });

  it('rate limit message references gunfire / cannons', () => {
    expect(VALIDATOR_MESSAGES.ERR_RATE_LIMITED.toLowerCase()).toMatch(/cannon|reload|easy/);
  });

  it('voyage frozen message names the Charts', () => {
    expect(VALIDATOR_MESSAGES.ERR_VOYAGE_FROZEN.toLowerCase()).toMatch(/charts|frozen|voyage/);
  });
});
