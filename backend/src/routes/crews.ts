import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import crypto from 'node:crypto';
import type { Pool } from 'pg';
import type { Env } from '../config/env.js';
import { signAccessToken, signRefreshToken, setSessionCookies } from '../auth/jwt.js';
import { requireAuth, type AuthedRequest } from './_auth.js';

interface Deps {
  pool: Pool;
  env: Env;
}

const CreateCrewSchema = z.object({
  name: z.string().min(2).max(40),
  flag_emoji: z.string().max(8).optional(),
});

const JoinCrewSchema = z.object({
  invite_code: z.string().min(6).max(32),
});

function genInviteCode(): string {
  return crypto.randomBytes(6).toString('base64url').slice(0, 10);
}

export function crewRoutes(deps: Deps): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.addHook('preHandler', requireAuth(deps.env));

    app.post('/', async (req, reply) => {
      const r = req as AuthedRequest;
      const parsed = CreateCrewSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, code: 'ERR_BAD_INPUT', message: 'Crew name be invalid.' });
      }
      if (r.user.crew_id) {
        return reply.code(409).send({ ok: false, code: 'ERR_ALREADY_ON_CREW', message: 'Ye already sail with a Crew.' });
      }
      const invite = genInviteCode();
      let row;
      try {
        const { rows } = await deps.pool.query<{ id: string; name: string; invite_code: string }>(
          `INSERT INTO crews (name, flag_emoji, invite_code)
           VALUES ($1, $2, $3)
           RETURNING id, name, invite_code`,
          [parsed.data.name, parsed.data.flag_emoji ?? null, invite],
        );
        row = rows[0];
      } catch (err) {
        const e = err as { code?: string };
        if (e.code === '23505') {
          return reply.code(409).send({ ok: false, code: 'ERR_CREW_NAME_TAKEN', message: 'That Crew name is taken.' });
        }
        throw err;
      }
      await deps.pool.query(`UPDATE pirates SET crew_id = $1 WHERE id = $2`, [row.id, r.user.id]);

      // Re-issue the access token so the JWT carries the new crew_id.
      const access = signAccessToken(app, deps.env, {
        id: r.user.id,
        role: r.user.role,
        crew_id: row.id,
        handle: r.user.handle,
      });
      const refresh =
        (req as unknown as { cookies: Record<string, string | undefined> }).cookies['progctf_refresh'] ??
        signRefreshToken(app, deps.env, r.user.id);
      setSessionCookies(reply, deps.env, access, refresh, r.user.role === 'admin');

      return reply.code(201).send({
        ok: true,
        message: `Crew "${row.name}" hoists colors.`,
        crew: row,
      });
    });

    /**
     * GET /api/crews/:name — Crew profile + members + solved Islands.
     * Used by the frontend Crew page. Sorted by solve recency.
     */
    app.get<{ Params: { name: string } }>('/:name', async (req, reply) => {
      const name = req.params.name;
      if (!name || name.length < 2 || name.length > 40) {
        return reply.code(400).send({
          ok: false,
          code: 'ERR_BAD_INPUT',
          message: 'Crew name be malformed.',
        });
      }

      const { rows: crewRows } = await deps.pool.query<{
        id: string;
        name: string;
        flag_emoji: string | null;
      }>(
        `SELECT id, name, flag_emoji FROM crews WHERE name = $1 LIMIT 1`,
        [name],
      );
      const crew = crewRows[0];
      if (!crew) {
        return reply.code(404).send({
          ok: false,
          code: 'ERR_NO_CREW',
          message: 'No Crew sails under that name.',
        });
      }

      // Total score for this crew.
      const { rows: scoreRows } = await deps.pool.query<{ score: string }>(
        `SELECT COALESCE(SUM(awarded_points), 0)::text AS score
           FROM submissions
          WHERE crew_id = $1 AND is_correct = true`,
        [crew.id],
      );
      const score = Number(scoreRows[0]?.score ?? 0);

      // Rank by points DESC, last-solve ASC tiebreak (matches Charts ordering).
      const { rows: rankRows } = await deps.pool.query<{ r: string }>(
        `WITH crew_totals AS (
           SELECT c.id,
                  COALESCE(SUM(s.awarded_points), 0) AS pts,
                  MAX(s.created_at)                  AS last_at
             FROM crews c
             LEFT JOIN submissions s ON s.crew_id = c.id AND s.is_correct = true
            WHERE c.banned_at IS NULL
            GROUP BY c.id
         )
         SELECT (RANK() OVER (ORDER BY pts DESC, last_at ASC))::text AS r
           FROM crew_totals
          WHERE id = $1`,
        [crew.id],
      );
      const rank = rankRows[0]?.r ? Number(rankRows[0].r) : null;

      const { rows: memberRows } = await deps.pool.query<{ handle: string }>(
        `SELECT handle FROM pirates WHERE crew_id = $1 ORDER BY handle ASC`,
        [crew.id],
      );

      const { rows: solvedRows } = await deps.pool.query<{
        island_slug: string;
        island_title: string;
        category: string;
        difficulty: string;
        awarded_points: number;
        first_blood: boolean;
        solved_at: string;
      }>(
        `SELECT i.slug              AS island_slug,
                i.title             AS island_title,
                i.category,
                i.difficulty,
                s.awarded_points,
                (i.first_blood_crew = $1) AS first_blood,
                s.created_at        AS solved_at
           FROM submissions s
           JOIN islands i ON i.id = s.island_id
          WHERE s.crew_id = $1 AND s.is_correct = true
          ORDER BY s.created_at DESC`,
        [crew.id],
      );

      return reply.send({
        id: crew.id,
        name: crew.name,
        flag_emoji: crew.flag_emoji,
        score,
        rank,
        members: memberRows,
        solved: solvedRows.map((s) => ({
          ...s,
          solved_at: new Date(s.solved_at).toISOString(),
        })),
      });
    });

    app.post('/join', async (req, reply) => {
      const r = req as AuthedRequest;
      const parsed = JoinCrewSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, code: 'ERR_BAD_INPUT', message: 'Invite code invalid.' });
      }
      if (r.user.crew_id) {
        return reply.code(409).send({ ok: false, code: 'ERR_ALREADY_ON_CREW', message: 'Ye already sail with a Crew.' });
      }
      const { rows } = await deps.pool.query<{ id: string; name: string; banned_at: Date | null }>(
        `SELECT id, name, banned_at FROM crews WHERE invite_code = $1`,
        [parsed.data.invite_code],
      );
      const crew = rows[0];
      if (!crew) {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_CREW', message: 'No Crew with that invite.' });
      }
      if (crew.banned_at) {
        return reply.code(403).send({ ok: false, code: 'ERR_CREW_BANNED', message: 'That Crew be in the brig.' });
      }
      await deps.pool.query(`UPDATE pirates SET crew_id = $1 WHERE id = $2`, [crew.id, r.user.id]);

      const access = signAccessToken(app, deps.env, {
        id: r.user.id,
        role: r.user.role,
        crew_id: crew.id,
        handle: r.user.handle,
      });
      const refresh =
        (req as unknown as { cookies: Record<string, string | undefined> }).cookies['progctf_refresh'] ??
        signRefreshToken(app, deps.env, r.user.id);
      setSessionCookies(reply, deps.env, access, refresh, r.user.role === 'admin');

      return reply.send({
        ok: true,
        message: `Welcome to the ${crew.name} crew.`,
        crew: { id: crew.id, name: crew.name },
      });
    });
  };
}
