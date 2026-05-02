import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../config/env.js';

/**
 * The Charts — leaderboard service.
 *
 * Top-20 Crews by total points (sum of awarded_points across correct submissions).
 * Tiebreaker (per spec §11): earliest timestamp of last scoring submission wins
 * (i.e. the Crew that locked their score in first).
 *
 * Cached in Redis with a 5s TTL so we avoid hammering Postgres on every WS tick.
 */

const CACHE_KEY = 'progctf:charts:top20';

export interface CrewChartRow {
  crew_id: string;
  crew_name: string;
  flag_emoji: string | null;
  points: number;
  solves: number;
  last_solve_at: string | null; // ISO
}

export async function recomputeTop20(pool: Pool): Promise<CrewChartRow[]> {
  const sql = `
    SELECT c.id        AS crew_id,
           c.name      AS crew_name,
           c.flag_emoji,
           COALESCE(SUM(s.awarded_points), 0)::int AS points,
           COUNT(*)::int                            AS solves,
           MAX(s.created_at)                        AS last_solve_at
      FROM crews c
      JOIN submissions s ON s.crew_id = c.id AND s.is_correct = true
     WHERE c.banned_at IS NULL
     GROUP BY c.id, c.name, c.flag_emoji
     ORDER BY points DESC, last_solve_at ASC
     LIMIT 20
  `;
  const { rows } = await pool.query<CrewChartRow>(sql);
  return rows.map((r) => ({
    ...r,
    last_solve_at: r.last_solve_at ? new Date(r.last_solve_at).toISOString() : null,
  }));
}

export async function getTop20Cached(pool: Pool, redis: Redis, env: Env): Promise<CrewChartRow[]> {
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    try {
      return JSON.parse(cached) as CrewChartRow[];
    } catch {
      // fall through to recompute
    }
  }
  const fresh = await recomputeTop20(pool);
  await redis.set(CACHE_KEY, JSON.stringify(fresh), 'EX', env.CHARTS_CACHE_TTL);
  return fresh;
}

/** Force recompute and overwrite the cache. Used by admin recalc + after every solve. */
export async function flushChartsCache(pool: Pool, redis: Redis, env: Env): Promise<CrewChartRow[]> {
  const fresh = await recomputeTop20(pool);
  await redis.set(CACHE_KEY, JSON.stringify(fresh), 'EX', env.CHARTS_CACHE_TTL);
  return fresh;
}

/** A Crew's own standing — rank, points, solved islands. */
export async function getCrewStanding(pool: Pool, crewId: string): Promise<{
  crew_id: string;
  crew_name: string;
  points: number;
  solves: number;
  rank: number | null;
  solved_islands: { slug: string; title: string; points: number; at: string }[];
}> {
  const { rows: crewRows } = await pool.query<{ id: string; name: string }>(
    `SELECT id, name FROM crews WHERE id = $1`,
    [crewId],
  );
  if (crewRows.length === 0) {
    throw new Error('crew not found');
  }
  const crew = crewRows[0];

  const { rows: scoreRows } = await pool.query<{ points: string; solves: string }>(
    `SELECT COALESCE(SUM(awarded_points), 0)::text AS points,
            COUNT(*)::text                          AS solves
       FROM submissions
      WHERE crew_id = $1 AND is_correct = true`,
    [crewId],
  );
  const points = Number(scoreRows[0]?.points ?? 0);
  const solves = Number(scoreRows[0]?.solves ?? 0);

  const { rows: rankRows } = await pool.query<{ r: string }>(
    `WITH crew_totals AS (
       SELECT c.id,
              COALESCE(SUM(s.awarded_points), 0) AS pts,
              MAX(s.created_at)                  AS last_at
         FROM crews c
         LEFT JOIN submissions s ON s.crew_id = c.id AND s.is_correct = true
        WHERE c.banned_at IS NULL
        GROUP BY c.id
     )
     SELECT (RANK() OVER (ORDER BY pts DESC, last_at ASC))::text AS r, id
       FROM crew_totals
       WHERE id = $1`,
    [crewId],
  );
  const rank = rankRows[0]?.r ? Number(rankRows[0].r) : null;

  const { rows: solvedRows } = await pool.query<{ slug: string; title: string; points: number; at: string }>(
    `SELECT i.slug, i.title, s.awarded_points AS points, s.created_at AS at
       FROM submissions s
       JOIN islands i ON i.id = s.island_id
      WHERE s.crew_id = $1 AND s.is_correct = true
      ORDER BY s.created_at ASC`,
    [crewId],
  );

  return {
    crew_id: crew.id,
    crew_name: crew.name,
    points,
    solves,
    rank,
    solved_islands: solvedRows.map((r) => ({
      slug: r.slug,
      title: r.title,
      points: r.points,
      at: new Date(r.at).toISOString(),
    })),
  };
}
