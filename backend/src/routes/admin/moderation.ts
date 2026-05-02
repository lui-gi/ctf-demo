import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../../config/env.js';
import { audit } from '../../services/audit.js';

interface Deps {
  pool: Pool;
  redis: Redis;
  env: Env;
}

const SubmissionsQuery = z.object({
  island_id: z.string().uuid().optional(),
  crew_id: z.string().uuid().optional(),
  pirate_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export function adminModerationRoutes(deps: Deps): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.post<{ Params: { id: string } }>('/crews/:id/ban', async (req, reply) => {
      const { rowCount } = await deps.pool.query(
        `UPDATE crews SET banned_at = now() WHERE id = $1 AND banned_at IS NULL`,
        [req.params.id],
      );
      if ((rowCount ?? 0) === 0) {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_CREW' });
      }
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'crew.ban',
        targetId: req.params.id,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      return reply.send({ ok: true, message: 'Crew sent to the brig.' });
    });

    app.post<{ Params: { id: string } }>('/crews/:id/unban', async (req, reply) => {
      const { rowCount } = await deps.pool.query(
        `UPDATE crews SET banned_at = NULL WHERE id = $1`,
        [req.params.id],
      );
      if ((rowCount ?? 0) === 0) {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_CREW' });
      }
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'crew.unban',
        targetId: req.params.id,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      return reply.send({ ok: true, message: 'Crew released from the brig.' });
    });

    app.post<{ Params: { id: string } }>('/pirates/:id/ban', async (req, reply) => {
      const { rowCount } = await deps.pool.query(
        `UPDATE pirates SET banned_at = now() WHERE id = $1 AND banned_at IS NULL`,
        [req.params.id],
      );
      if ((rowCount ?? 0) === 0) {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_PIRATE' });
      }
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'pirate.ban',
        targetId: req.params.id,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      return reply.send({ ok: true, message: 'Pirate keelhauled.' });
    });

    app.get('/submissions', async (req, reply) => {
      const parsed = SubmissionsQuery.safeParse(req.query);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, code: 'ERR_BAD_INPUT', issues: parsed.error.issues });
      }
      const { island_id, crew_id, pirate_id, limit, offset } = parsed.data;
      const where: string[] = [];
      const args: unknown[] = [];
      let i = 1;
      if (island_id) { where.push(`island_id = $${i++}`); args.push(island_id); }
      if (crew_id)   { where.push(`crew_id = $${i++}`);   args.push(crew_id); }
      if (pirate_id) { where.push(`pirate_id = $${i++}`); args.push(pirate_id); }
      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
      args.push(limit); args.push(offset);
      const { rows } = await deps.pool.query(
        `SELECT id, pirate_id, crew_id, island_id, submitted, is_correct, awarded_points, ip, user_agent, created_at
           FROM submissions
           ${whereClause}
           ORDER BY created_at DESC
           LIMIT $${i++} OFFSET $${i++}`,
        args,
      );
      return reply.send({ ok: true, submissions: rows });
    });

    app.get('/audit', async (req) => {
      const { rows } = await deps.pool.query(
        `SELECT id, admin_pirate_id, action, target_id, payload_json, ip, user_agent, created_at
           FROM audit_log ORDER BY created_at DESC LIMIT 200`,
      );
      void req;
      return { ok: true, audit: rows };
    });
  };
}
