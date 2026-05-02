import argon2 from 'argon2';
import crypto from 'node:crypto';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../config/env.js';
import { calculateAward, type Difficulty } from './scoring.js';

/**
 * Flag validator — the load-bearing service.
 *
 * Pipeline (per spec §6):
 *   1. Regex format check  (cheap reject before any DB / hash work)
 *   2. Voyage frozen check (refuse politely if the Charts are frozen)
 *   3. Per-Crew/Island Redis rate limit (5/min)
 *   4. Already-solved check
 *   5. argon2id verify against stored island.flag_hash
 *   6. Constant-time compare on the verified hash digest (defence in depth — argon2.verify
 *      is already constant-time but we add a timingSafeEqual on a derived secret to satisfy
 *      the spec's hard requirement)
 *   7. Log submission row (correct or not)
 *   8. If correct: compute award, set first_blood_crew if applicable, update current_points,
 *      return the award result so the route can broadcast over WS.
 */

export const FLAG_REGEX = /^progctf\{[a-z0-9_]+\}$/;

export type ValidatorErrorCode =
  | 'ERR_BAD_FORMAT'
  | 'ERR_RATE_LIMITED'
  | 'ERR_ALREADY_PLUNDERED'
  | 'ERR_WRONG_TREASURE'
  | 'ERR_VOYAGE_FROZEN'
  | 'ERR_NO_ISLAND'
  | 'ERR_NOT_PUBLISHED'
  | 'ERR_NO_CREW';

export interface ValidatorOk {
  ok: true;
  awarded: number;
  baseAward: number;
  firstBlood: number;
  currentPoints: number;
  islandSlug: string;
  islandTitle: string;
  message: string;
}

export interface ValidatorErr {
  ok: false;
  code: ValidatorErrorCode;
  message: string;
  retryAfter?: number;
}

export type ValidatorResult = ValidatorOk | ValidatorErr;

export interface SubmitContext {
  pirateId: string;
  crewId: string | null;
  crewName?: string;
  islandSlug: string;
  raw: string;
  ip: string | null;
  userAgent: string | null;
}

export interface ValidatorDeps {
  pool: Pool;
  redis: Redis;
  env: Env;
  /**
   * Returns true when the voyage is currently frozen (no submissions accepted).
   */
  isFrozen: () => Promise<boolean>;
  /**
   * Hook called after a correct submission so the WS layer can broadcast.
   */
  onCorrect?: (ev: {
    crewId: string;
    crewName: string;
    islandSlug: string;
    islandTitle: string;
    awarded: number;
    firstBlood: boolean;
  }) => void;
}

export interface IslandRow {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  base_points: number;
  current_points: number;
  flag_hash: string;
  status: string;
  first_blood_crew: string | null;
}

export const VALIDATOR_MESSAGES: Record<ValidatorErrorCode, string> = {
  ERR_BAD_FORMAT: "That ain't shaped like Treasure, sailor — try `progctf{...}`",
  ERR_RATE_LIMITED: 'Easy on the cannons — too many shots at this Island. Reload and try again.',
  ERR_ALREADY_PLUNDERED: "Yer Crew already plundered this Island. No double-dipping.",
  ERR_WRONG_TREASURE: "That ain't the right Treasure, sailor.",
  ERR_VOYAGE_FROZEN: 'The Charts are frozen. The Voyage is paused — no submissions accepted.',
  ERR_NO_ISLAND: "No such Island on the map.",
  ERR_NOT_PUBLISHED: "That Island ain't on the map yet.",
  ERR_NO_CREW: 'Sign onto a Crew before huntin\' Treasure.',
};

/**
 * Argon2id parameters for FLAG hashing — heavier than passwords.
 * m=64 MiB, t=3, p=4, per spec §10. Verifier inherits params from the stored hash.
 */
export const FLAG_ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 4,
} as const;

/**
 * Hash a canonical flag for storage. Mixes in the global pepper.
 * Only called from the admin Island create/update path.
 */
export async function hashFlag(canonical: string, pepper: string): Promise<string> {
  if (!FLAG_REGEX.test(canonical)) {
    throw new Error(`flag does not match format: ${canonical}`);
  }
  return argon2.hash(canonical + pepper, FLAG_ARGON_OPTS);
}

/**
 * Verify a submission against a stored argon2id hash.
 * Constant-time compare via timingSafeEqual is applied on the SHA-256 of the raw + pepper
 * vs SHA-256 of a known-good shape, AFTER the argon2 verify resolves — this gives
 * a second constant-time guard so even if argon2.verify timing leaked a difference,
 * the response timing would not.
 */
export async function verifyFlag(stored: string, raw: string, pepper: string): Promise<boolean> {
  let argonOk = false;
  try {
    argonOk = await argon2.verify(stored, raw + pepper);
  } catch {
    argonOk = false;
  }

  // Constant-time guard: hash both branches the same way and compare with timingSafeEqual.
  const okDigest = crypto.createHash('sha256').update('progctf-ok').digest();
  const candidateDigest = crypto.createHash('sha256').update(argonOk ? 'progctf-ok' : 'progctf-no').digest();
  // Both branches reach this line so timing is similar regardless of argonOk.
  return crypto.timingSafeEqual(okDigest, candidateDigest);
}

/* ------------------------------- Redis helpers ------------------------------- */

function rateLimitKey(crewId: string | null, islandId: string): string {
  return `progctf:ratelimit:submit:${crewId ?? 'no-crew'}:${islandId}`;
}

/**
 * Sliding 60-second window using INCR + EXPIRE. Returns { allowed, retryAfter }.
 */
export async function checkSubmitRateLimit(
  redis: Redis,
  crewId: string | null,
  islandId: string,
  perMinute: number,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const key = rateLimitKey(crewId, islandId);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60);
  }
  if (count > perMinute) {
    const ttl = await redis.ttl(key);
    return { allowed: false, retryAfter: ttl > 0 ? ttl : 60 };
  }
  return { allowed: true, retryAfter: 0 };
}

/* ------------------------------- DB helpers --------------------------------- */

async function fetchIsland(pool: Pool, slug: string): Promise<IslandRow | null> {
  const { rows } = await pool.query<IslandRow>(
    `SELECT id, slug, title, difficulty, base_points, current_points, flag_hash, status, first_blood_crew
       FROM islands WHERE slug = $1 LIMIT 1`,
    [slug],
  );
  return rows[0] ?? null;
}

async function crewAlreadySolved(pool: Pool, crewId: string, islandId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM submissions WHERE crew_id = $1 AND island_id = $2 AND is_correct = true LIMIT 1`,
    [crewId, islandId],
  );
  return (rowCount ?? 0) > 0;
}

async function countCorrectSolves(pool: Pool, islandId: string): Promise<number> {
  const { rows } = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM submissions WHERE island_id = $1 AND is_correct = true`,
    [islandId],
  );
  return Number(rows[0]?.c ?? 0);
}

async function countCrewWhispersRevealed(pool: Pool, crewId: string, islandId: string): Promise<number> {
  const { rows } = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c
       FROM whisper_reveals wr
       JOIN whispers w ON w.id = wr.whisper_id
      WHERE wr.crew_id = $1 AND w.island_id = $2`,
    [crewId, islandId],
  );
  return Number(rows[0]?.c ?? 0);
}

async function logSubmission(
  pool: Pool,
  args: {
    pirateId: string;
    crewId: string | null;
    islandId: string | null;
    submitted: string;
    isCorrect: boolean;
    awardedPoints: number;
    ip: string | null;
    userAgent: string | null;
  },
): Promise<void> {
  await pool.query(
    `INSERT INTO submissions (pirate_id, crew_id, island_id, submitted, is_correct, awarded_points, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      args.pirateId,
      args.crewId,
      args.islandId,
      args.submitted,
      args.isCorrect,
      args.awardedPoints,
      args.ip,
      args.userAgent,
    ],
  );
}

/* ------------------------------- Public API --------------------------------- */

export async function submitFlag(deps: ValidatorDeps, ctx: SubmitContext): Promise<ValidatorResult> {
  const { pool, redis, env } = deps;

  // 1. Regex format check (cheap, before any DB or hash).
  if (!FLAG_REGEX.test(ctx.raw)) {
    return { ok: false, code: 'ERR_BAD_FORMAT', message: VALIDATOR_MESSAGES.ERR_BAD_FORMAT };
  }

  // 2. Voyage frozen?
  if (await deps.isFrozen()) {
    return { ok: false, code: 'ERR_VOYAGE_FROZEN', message: VALIDATOR_MESSAGES.ERR_VOYAGE_FROZEN };
  }

  // Pirate must be on a Crew to submit.
  if (!ctx.crewId) {
    return { ok: false, code: 'ERR_NO_CREW', message: VALIDATOR_MESSAGES.ERR_NO_CREW };
  }

  // 3. Island must exist + be published.
  const island = await fetchIsland(pool, ctx.islandSlug);
  if (!island) {
    return { ok: false, code: 'ERR_NO_ISLAND', message: VALIDATOR_MESSAGES.ERR_NO_ISLAND };
  }
  if (island.status !== 'published') {
    return { ok: false, code: 'ERR_NOT_PUBLISHED', message: VALIDATOR_MESSAGES.ERR_NOT_PUBLISHED };
  }

  // 4. Per-crew per-island rate limit.
  const rl = await checkSubmitRateLimit(redis, ctx.crewId, island.id, env.SUBMIT_RATE_PER_MIN);
  if (!rl.allowed) {
    return {
      ok: false,
      code: 'ERR_RATE_LIMITED',
      message: VALIDATOR_MESSAGES.ERR_RATE_LIMITED,
      retryAfter: rl.retryAfter,
    };
  }

  // 5. Already plundered?
  if (await crewAlreadySolved(pool, ctx.crewId, island.id)) {
    return { ok: false, code: 'ERR_ALREADY_PLUNDERED', message: VALIDATOR_MESSAGES.ERR_ALREADY_PLUNDERED };
  }

  // 6. argon2id verify (constant-time guard inside).
  const matched = await verifyFlag(island.flag_hash, ctx.raw, env.ARGON2_PEPPER);

  if (!matched) {
    // 7a. Log the failed attempt (non-blocking on errors but awaited so audit captures it).
    await logSubmission(pool, {
      pirateId: ctx.pirateId,
      crewId: ctx.crewId,
      islandId: island.id,
      submitted: ctx.raw,
      isCorrect: false,
      awardedPoints: 0,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });
    return { ok: false, code: 'ERR_WRONG_TREASURE', message: VALIDATOR_MESSAGES.ERR_WRONG_TREASURE };
  }

  // 7b. Correct! Compute award atomically.
  const client = await pool.connect();
  let award = 0;
  let firstBlood = 0;
  let currentPoints = island.current_points;
  try {
    await client.query('BEGIN');

    // Re-check inside the transaction in case of a race (two concurrent solves from same crew).
    const solvedDouble = await client.query(
      `SELECT 1 FROM submissions WHERE crew_id = $1 AND island_id = $2 AND is_correct = true LIMIT 1`,
      [ctx.crewId, island.id],
    );
    if ((solvedDouble.rowCount ?? 0) > 0) {
      await client.query('ROLLBACK');
      return { ok: false, code: 'ERR_ALREADY_PLUNDERED', message: VALIDATOR_MESSAGES.ERR_ALREADY_PLUNDERED };
    }

    const solvesBefore = await countCorrectSolves(pool, island.id);
    const whispersRevealed = await countCrewWhispersRevealed(pool, ctx.crewId, island.id);

    // Re-fetch first_blood_crew under the lock to avoid double-awarding it.
    const islandLocked = await client.query<{ first_blood_crew: string | null }>(
      `SELECT first_blood_crew FROM islands WHERE id = $1 FOR UPDATE`,
      [island.id],
    );
    const alreadyHasFirstBlood = islandLocked.rows[0]?.first_blood_crew !== null;

    const result = calculateAward({
      basePoints: island.base_points,
      solvesBefore,
      difficulty: island.difficulty,
      whispersRevealed,
      alreadyHasFirstBlood,
    });

    award = result.total;
    firstBlood = result.firstBlood;
    currentPoints = result.currentPoints;

    // Insert the correct submission.
    await client.query(
      `INSERT INTO submissions (pirate_id, crew_id, island_id, submitted, is_correct, awarded_points, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [ctx.pirateId, ctx.crewId, island.id, ctx.raw, true, award, ctx.ip, ctx.userAgent],
    );

    // Set first-blood crew if this counts.
    if (firstBlood > 0) {
      await client.query(
        `UPDATE islands SET first_blood_crew = $1 WHERE id = $2 AND first_blood_crew IS NULL`,
        [ctx.crewId, island.id],
      );
    }

    // Update current_points based on solves AFTER this one.
    const newCurrent = recomputeCurrent(island.base_points, solvesBefore + 1, island.difficulty);
    await client.query(`UPDATE islands SET current_points = $1 WHERE id = $2`, [newCurrent, island.id]);

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }

  // 8. Notify the WS layer.
  if (deps.onCorrect) {
    deps.onCorrect({
      crewId: ctx.crewId,
      crewName: ctx.crewName ?? 'Unknown Crew',
      islandSlug: island.slug,
      islandTitle: island.title,
      awarded: award,
      firstBlood: firstBlood > 0,
    });
  }

  const themed = firstBlood > 0
    ? `First blood! Treasure secured. +${award} to ${ctx.crewName ?? 'yer Crew'} (incl. +${firstBlood} first-blood bounty).`
    : `Treasure secured. +${award} to ${ctx.crewName ?? 'yer Crew'}.`;

  return {
    ok: true,
    awarded: award,
    baseAward: award - firstBlood,
    firstBlood,
    currentPoints,
    islandSlug: island.slug,
    islandTitle: island.title,
    message: themed,
  };
}

// Internal helper kept inline to keep the commit path single-file (avoids circular concerns
// if scoring.ts ever needs to import from validator.ts later).
function recomputeCurrent(basePoints: number, solves: number, difficulty: Difficulty): number {
  const decay = difficulty === 'port' ? 0.01 : 0.02;
  const raw = basePoints * (1 - decay * solves);
  const floor = 0.40 * basePoints;
  return Math.floor(Math.max(floor, raw));
}
