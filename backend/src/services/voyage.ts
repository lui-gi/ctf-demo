import type { Pool } from 'pg';
import type { Redis } from 'ioredis';

/**
 * Voyage state — frozen / unfrozen.
 *
 * Source of truth: `voyage_state` table (singleton row id=1).
 * Cached in Redis under `progctf:voyage:frozen` for hot-path reads (every submit).
 * Cache TTL: 30s — admin freeze/unfreeze MUSTflush the cache to take effect immediately.
 */

const CACHE_KEY = 'progctf:voyage:frozen';
const CACHE_TTL = 30;

export async function isFrozen(pool: Pool, redis: Redis): Promise<boolean> {
  const cached = await redis.get(CACHE_KEY);
  if (cached !== null) {
    return cached === '1';
  }
  const { rows } = await pool.query<{ frozen: boolean }>(
    `SELECT frozen FROM voyage_state WHERE id = 1`,
  );
  const frozen = rows[0]?.frozen ?? false;
  await redis.set(CACHE_KEY, frozen ? '1' : '0', 'EX', CACHE_TTL);
  return frozen;
}

export async function freezeVoyage(pool: Pool, redis: Redis): Promise<void> {
  await pool.query(
    `UPDATE voyage_state SET frozen = true, frozen_at = now() WHERE id = 1`,
  );
  await redis.set(CACHE_KEY, '1', 'EX', CACHE_TTL);
}

export async function unfreezeVoyage(pool: Pool, redis: Redis): Promise<void> {
  await pool.query(
    `UPDATE voyage_state SET frozen = false, unfrozen_at = now() WHERE id = 1`,
  );
  await redis.set(CACHE_KEY, '0', 'EX', CACHE_TTL);
}
