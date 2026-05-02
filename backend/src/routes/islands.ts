import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../config/env.js';
import { requireAuth, type AuthedRequest } from './_auth.js';
import { submitFlag, VALIDATOR_MESSAGES } from '../services/validator.js';
import { isFrozen } from '../services/voyage.js';
import { flushChartsCache } from '../services/charts.js';
import type { SandboxSessionRegistry } from '../services/sandboxSessions.js';
import { audit } from '../services/audit.js';

interface Deps {
  pool: Pool;
  redis: Redis;
  env: Env;
  /** WS broadcaster injected by server.ts */
  broadcastSolve?: (ev: {
    crewId: string;
    crewName: string;
    islandSlug: string;
    islandTitle: string;
    awarded: number;
    firstBlood: boolean;
  }) => void;
  /**
   * Per-Crew shell session registry — owned by server.ts so that admin routes
   * (admin/sandbox.ts) can read & forcibly close sessions opened from here.
   * Optional so the legacy test setup (which wires islandRoutes without admin)
   * still constructs without surprise — when omitted, the WS shell handler runs
   * with a private one-off registry scoped to the route plugin.
   */
  sandboxSessions?: SandboxSessionRegistry;
}

const SubmitSchema = z.object({
  flag: z.string().min(1).max(256),
});

export function islandRoutes(deps: Deps): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.addHook('preHandler', requireAuth(deps.env));

    // GET /api/islands — published only by default, sanitized.
    // Admins can pass `?include_unpublished=1` to also see drafts and archived.
    // Non-admins passing the flag get 403 (we don't silently ignore — Helmsman's
    // frontend needs to know the flag isn't honoured for them).
    app.get<{ Querystring: { include_unpublished?: string } }>('/', async (req, reply) => {
      const r = req as AuthedRequest;
      const includeFlag = req.query?.include_unpublished;
      const wantsAll =
        includeFlag === '1' || includeFlag === 'true';
      if (wantsAll && r.user.role !== 'admin') {
        return reply.code(403).send({
          ok: false,
          code: 'ERR_NOT_ADMIN',
          message: 'Only the captain may peek at unpublished Islands.',
        });
      }
      const { rows } = await deps.pool.query<{
        slug: string;
        title: string;
        category: string;
        difficulty: string;
        base_points: number;
        current_points: number;
        first_blood_crew: string | null;
        status: string;
        solves: string;
        solved: boolean;
      }>(
        `SELECT i.slug, i.title, i.category, i.difficulty, i.base_points, i.current_points,
                i.first_blood_crew, i.status,
                COALESCE((SELECT COUNT(*) FROM submissions s WHERE s.island_id = i.id AND s.is_correct = true), 0)::text AS solves,
                CASE WHEN $1::uuid IS NOT NULL AND EXISTS (
                  SELECT 1 FROM submissions s
                   WHERE s.island_id = i.id AND s.is_correct = true AND s.crew_id = $1::uuid
                ) THEN true ELSE false END AS solved
           FROM islands i
          WHERE ($2::boolean IS TRUE) OR i.status = 'published'
          ORDER BY i.category, i.difficulty, i.base_points`,
        [r.user.crew_id, wantsAll],
      );
      return {
        ok: true,
        islands: rows.map((row) => ({ ...row, solves: Number(row.solves) })),
      };
    });

    // GET /api/islands/:slug — published detail
    app.get<{ Params: { slug: string } }>('/:slug', async (req, reply) => {
      const r = req as AuthedRequest;
      const { rows: islandRows } = await deps.pool.query<{
        id: string;
        slug: string;
        title: string;
        category: string;
        difficulty: string;
        description_md: string;
        base_points: number;
        current_points: number;
        files_url: string | null;
        sandbox_image: string | null;
        first_blood_crew: string | null;
        status: string;
      }>(
        `SELECT id, slug, title, category, difficulty, description_md, base_points, current_points,
                files_url, sandbox_image, first_blood_crew, status
           FROM islands WHERE slug = $1`,
        [req.params.slug],
      );
      const island = islandRows[0];
      if (!island || island.status !== 'published') {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_ISLAND', message: VALIDATOR_MESSAGES.ERR_NO_ISLAND });
      }

      const { rows: whisperRows } = await deps.pool.query<{
        id: string;
        ordinal: number;
        cost_points: number;
        revealed: boolean;
        body_md: string | null;
      }>(
        `SELECT w.id, w.ordinal, w.cost_points,
                CASE WHEN $1::uuid IS NOT NULL AND EXISTS (
                  SELECT 1 FROM whisper_reveals wr WHERE wr.crew_id = $1::uuid AND wr.whisper_id = w.id
                ) THEN true ELSE false END AS revealed,
                CASE WHEN $1::uuid IS NOT NULL AND EXISTS (
                  SELECT 1 FROM whisper_reveals wr WHERE wr.crew_id = $1::uuid AND wr.whisper_id = w.id
                ) THEN w.body_md ELSE NULL END AS body_md
           FROM whispers w
          WHERE w.island_id = $2
          ORDER BY w.ordinal`,
        [r.user.crew_id, island.id],
      );

      const { rows: solvedRows } = await deps.pool.query<{ solved: boolean; solves: string }>(
        `SELECT
           CASE WHEN $1::uuid IS NOT NULL AND EXISTS (
             SELECT 1 FROM submissions s WHERE s.island_id = $2 AND s.is_correct = true AND s.crew_id = $1::uuid
           ) THEN true ELSE false END AS solved,
           COALESCE((SELECT COUNT(*) FROM submissions s WHERE s.island_id = $2 AND s.is_correct = true), 0)::text AS solves`,
        [r.user.crew_id, island.id],
      );

      const { id: _omit, status: _omit2, ...sanitized } = island;
      void _omit; void _omit2;

      return {
        ok: true,
        island: {
          ...sanitized,
          solves: Number(solvedRows[0]?.solves ?? 0),
          solved_by_crew: solvedRows[0]?.solved ?? false,
          whispers: whisperRows,
        },
      };
    });

    // POST /api/islands/:slug/submit
    app.post<{ Params: { slug: string }; Body: { flag: string } }>('/:slug/submit', async (req, reply) => {
      const r = req as AuthedRequest;
      const parsed = SubmitSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({
          ok: false,
          code: 'ERR_BAD_INPUT',
          message: VALIDATOR_MESSAGES.ERR_BAD_FORMAT,
        });
      }

      // Look up the crew name for themed messages.
      let crewName: string | undefined;
      if (r.user.crew_id) {
        const { rows } = await deps.pool.query<{ name: string }>(
          `SELECT name FROM crews WHERE id = $1`,
          [r.user.crew_id],
        );
        crewName = rows[0]?.name;
      }

      const result = await submitFlag(
        {
          pool: deps.pool,
          redis: deps.redis,
          env: deps.env,
          isFrozen: () => isFrozen(deps.pool, deps.redis),
          onCorrect: deps.broadcastSolve,
        },
        {
          pirateId: r.user.id,
          crewId: r.user.crew_id,
          crewName,
          islandSlug: req.params.slug,
          raw: parsed.data.flag,
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        },
      );

      if (!result.ok) {
        switch (result.code) {
          case 'ERR_BAD_FORMAT':
            return reply.code(400).send(result);
          case 'ERR_RATE_LIMITED':
            reply.header('Retry-After', String(result.retryAfter ?? 60));
            return reply.code(429).send(result);
          case 'ERR_VOYAGE_FROZEN':
            return reply.code(423).send(result);
          case 'ERR_NO_ISLAND':
          case 'ERR_NOT_PUBLISHED':
            return reply.code(404).send(result);
          case 'ERR_NO_CREW':
            return reply.code(403).send(result);
          case 'ERR_ALREADY_PLUNDERED':
            return reply.code(409).send(result);
          case 'ERR_WRONG_TREASURE':
            return reply.code(200).send(result);
          default:
            return reply.code(400).send(result);
        }
      }

      // Refresh charts cache so the next /api/charts read sees the new score.
      await flushChartsCache(deps.pool, deps.redis, deps.env).catch((err) => {
        req.log?.error({ err }, 'failed to flush charts cache after solve');
      });

      return reply.send(result);
    });

    /**
     * WS /api/islands/:slug/shell — per-Island, per-Crew terminal session.
     *
     * Phase-2 NO-CONTAINER PATH: Docker is not yet wired (see Phase-2
     * deferral log). Player input is recorded into the in-process session
     * ledger (mirrored to Redis) and echoed back as a clearly-marked
     * SIMULATED prompt — no command is ever executed in any shell.
     *
     * Phase-4 staging will replace the simulated stdout with a real per-Crew
     * sandbox container attach (Shipwright controller, spec §9). The session
     * ledger contract (open/touch/close + admin visibility) does NOT change
     * when that lands.
     *
     * Per-Crew isolation: registry key = (slug, crewId). Two crews on the
     * same Island get independent entries; messages cannot bleed because each
     * WS handler closure binds its own `socket.send`. A second connection
     * from the same crew on the same Island supersedes the first (the prior
     * socket is force-closed by the registry).
     *
     * Auth: inherits the plugin-level `requireAuth` preHandler — the WS
     * upgrade is rejected with 401 if no valid JWT cookie / bearer is
     * presented during the HTTP upgrade request.
     */
    app.get<{ Params: { slug: string } }>(
      '/:slug/shell',
      { websocket: true },
      (socket, req) => {
        const r = req as unknown as AuthedRequest;
        const slug = (req.params as { slug: string }).slug;
        const handle = r.user?.handle ?? 'sailor';
        const pirateId = r.user?.id ?? 'unknown';
        // Crewless players still get a personal-scope sandbox keyed by their
        // pirate id — they just can't earn points for a solve until they join
        // a Crew. This avoids a 4xx on the upgrade for the lone-wolf path.
        const crewId = r.user?.crew_id ?? `solo:${pirateId}`;
        const crewName = r.user?.crew_id ? handle : `${handle} (solo)`;
        const registry = deps.sandboxSessions;

        // Greet on connect.
        try {
          socket.send(
            JSON.stringify({
              kind: 'banner',
              text: `Welcome aboard the ${slug} shell, ${handle}. (simulated — no container attached)`,
            }),
          );
        } catch {
          // best-effort
        }

        // Register in the ledger. Closer is wired so the registry can force-
        // close this socket on idle-timeout / admin DELETE.
        const handle$ = registry?.open({
          islandSlug: slug,
          crewId,
          crewName,
          pirateId,
          closer: () => {
            try { socket.close(1000, 'session closed'); } catch { /* dead */ }
          },
        });

        // Audit the session start — best-effort; audit() already swallows.
        // Use the pirate id as the actor (admin_pirate_id is nullable; we use
        // it here as a generic actor column for shell-session activity).
        void audit(deps.pool, {
          adminPirateId: pirateId,
          action: 'sandbox.session.start',
          targetId: slug,
          payload: { crew_id: crewId, simulated: true },
          ip: req.ip ?? null,
          userAgent: (req.headers['user-agent'] as string | undefined) ?? null,
        });

        socket.on('message', (raw: unknown) => {
          let text = '';
          try {
            if (typeof raw === 'string') {
              text = raw;
            } else if (Buffer.isBuffer(raw)) {
              text = raw.toString('utf8');
            } else if (Array.isArray(raw)) {
              text = Buffer.concat(raw as Buffer[]).toString('utf8');
            } else if (raw instanceof ArrayBuffer) {
              text = Buffer.from(raw).toString('utf8');
            }
          } catch {
            text = '';
          }
          // Mark this session active in the ledger.
          handle$?.touch();
          const reply = {
            kind: 'stdout',
            echo: text.slice(0, 256),
            text: `[simulated] ${slug}$ ${text.slice(0, 256).replace(/\n+$/, '')}`,
          };
          try {
            socket.send(JSON.stringify(reply));
          } catch {
            // socket already closed
          }
        });

        socket.on('close', () => {
          if (registry) registry.drop(slug, crewId);
        });
      },
    );

    // POST /api/islands/:slug/whisper/:n — reveal whisper
    app.post<{ Params: { slug: string; n: string } }>('/:slug/whisper/:n', async (req, reply) => {
      const r = req as AuthedRequest;
      const ordinal = Number(req.params.n);
      if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > 3) {
        return reply.code(400).send({ ok: false, code: 'ERR_BAD_WHISPER', message: 'Whisper number invalid.' });
      }
      if (!r.user.crew_id) {
        return reply.code(403).send({ ok: false, code: 'ERR_NO_CREW', message: VALIDATOR_MESSAGES.ERR_NO_CREW });
      }

      const { rows: islandRows } = await deps.pool.query<{ id: string; status: string }>(
        `SELECT id, status FROM islands WHERE slug = $1`,
        [req.params.slug],
      );
      if (!islandRows[0] || islandRows[0].status !== 'published') {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_ISLAND', message: VALIDATOR_MESSAGES.ERR_NO_ISLAND });
      }
      const islandId = islandRows[0].id;

      const { rows: whisperRows } = await deps.pool.query<{ id: string; cost_points: number; body_md: string }>(
        `SELECT id, cost_points, body_md FROM whispers WHERE island_id = $1 AND ordinal = $2`,
        [islandId, ordinal],
      );
      const whisper = whisperRows[0];
      if (!whisper) {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_WHISPER', message: 'No such Whisper.' });
      }

      // Idempotent: if already revealed, just return it.
      const { rowCount: alreadyCount, rows: alreadyRows } = await deps.pool.query<{ cost_paid: number }>(
        `SELECT cost_paid FROM whisper_reveals WHERE crew_id = $1 AND whisper_id = $2`,
        [r.user.crew_id, whisper.id],
      );
      if ((alreadyCount ?? 0) > 0) {
        return reply.send({
          ok: true,
          message: 'Already heard, sailor.',
          whisper: { ordinal, body_md: whisper.body_md, cost_paid: alreadyRows[0].cost_paid },
        });
      }

      await deps.pool.query(
        `INSERT INTO whisper_reveals (crew_id, whisper_id, cost_paid) VALUES ($1, $2, $3)`,
        [r.user.crew_id, whisper.id, whisper.cost_points],
      );

      return reply.send({
        ok: true,
        message: 'A Whisper carries on the wind...',
        whisper: { ordinal, body_md: whisper.body_md, cost_paid: whisper.cost_points },
      });
    });
  };
}
