import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../../config/env.js';
import { hashFlag, FLAG_REGEX } from '../../services/validator.js';
import { audit } from '../../services/audit.js';

interface Deps {
  pool: Pool;
  redis: Redis;
  env: Env;
  broadcastIslandStatus?: (ev: { slug: string; status: 'published' | 'archived' | 'draft' }) => void;
}

const Difficulty = z.enum(['port', 'open_sea', 'cursed_depths']);
const Category = z.enum([
  'cursed_ports', 'cipher_cove', 'shipwrights_forge',
  'lighthouse', 'crows_nest', 'hidden_cargo', 'keymaster',
]);

const CreateIslandSchema = z.object({
  slug: z.string().min(2).max(80).regex(/^[a-z0-9_-]+$/, 'slug: lowercase, digits, _ or -'),
  title: z.string().min(2).max(200),
  category: Category,
  difficulty: Difficulty,
  description_md: z.string().min(1).max(20000),
  base_points: z.number().int().min(50).max(900),
  flag: z.string().regex(FLAG_REGEX, 'flag must match progctf{snake_case}'),
  files_url: z.string().url().nullable().optional(),
  sandbox_image: z.string().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

const PatchIslandSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description_md: z.string().min(1).max(20000).optional(),
  base_points: z.number().int().min(50).max(900).optional(),
  flag: z.string().regex(FLAG_REGEX).optional(),
  files_url: z.string().url().nullable().optional(),
  sandbox_image: z.string().nullable().optional(),
  category: Category.optional(),
  difficulty: Difficulty.optional(),
});

const StatusSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']),
});

const WhisperSchema = z.object({
  ordinal: z.number().int().min(1).max(3),
  body_md: z.string().min(1).max(4000),
  cost_points: z.number().int().min(0).max(1000),
});

const FilesSchema = z.object({
  files_url: z.string().url(),
});

export function adminIslandsRoutes(deps: Deps): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    // POST /admin/islands
    app.post('/', async (req, reply) => {
      const parsed = CreateIslandSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, code: 'ERR_BAD_INPUT', issues: parsed.error.issues });
      }
      const data = parsed.data;
      const flagHash = await hashFlag(data.flag, deps.env.ARGON2_PEPPER);
      try {
        const { rows } = await deps.pool.query<{ id: string; slug: string }>(
          `INSERT INTO islands (slug, title, category, difficulty, description_md, base_points, current_points,
                                flag_hash, files_url, sandbox_image, status)
           VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10)
           RETURNING id, slug`,
          [
            data.slug, data.title, data.category, data.difficulty, data.description_md,
            data.base_points, flagHash, data.files_url ?? null, data.sandbox_image ?? null, data.status,
          ],
        );
        const island = rows[0];
        await audit(deps.pool, {
          adminPirateId: (req as unknown as { user: { id: string } }).user.id,
          action: 'island.create',
          targetId: island.id,
          payload: { slug: island.slug, status: data.status },
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        });
        return reply.code(201).send({ ok: true, island });
      } catch (err) {
        const e = err as { code?: string };
        if (e.code === '23505') {
          return reply.code(409).send({ ok: false, code: 'ERR_SLUG_TAKEN', message: 'Slug already in use.' });
        }
        throw err;
      }
    });

    // PATCH /admin/islands/:id
    app.patch<{ Params: { id: string } }>('/:id', async (req, reply) => {
      const parsed = PatchIslandSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, code: 'ERR_BAD_INPUT', issues: parsed.error.issues });
      }
      const updates: string[] = [];
      const values: unknown[] = [];
      let i = 1;
      for (const [k, v] of Object.entries(parsed.data)) {
        if (k === 'flag') continue;
        updates.push(`${k} = $${i}`);
        values.push(v);
        i++;
      }
      if (parsed.data.flag) {
        const flagHash = await hashFlag(parsed.data.flag, deps.env.ARGON2_PEPPER);
        updates.push(`flag_hash = $${i}`);
        values.push(flagHash);
        i++;
      }
      if (updates.length === 0) {
        return reply.code(400).send({ ok: false, code: 'ERR_NO_UPDATES', message: 'Nothing to update.' });
      }
      values.push(req.params.id);
      const { rows } = await deps.pool.query<{ id: string; slug: string }>(
        `UPDATE islands SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, slug`,
        values,
      );
      if (rows.length === 0) {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_ISLAND', message: 'Island not found.' });
      }
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'island.update',
        targetId: rows[0].id,
        payload: { fields: Object.keys(parsed.data) },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      return reply.send({ ok: true, island: rows[0] });
    });

    // DELETE /admin/islands/:id
    app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
      const { rowCount } = await deps.pool.query(
        `DELETE FROM islands WHERE id = $1`,
        [req.params.id],
      );
      if ((rowCount ?? 0) === 0) {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_ISLAND' });
      }
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'island.delete',
        targetId: req.params.id,
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      return reply.send({ ok: true, message: 'Island scuttled.' });
    });

    // POST /admin/islands/:id/files (sets files_url; real upload handled by object storage CDN signed URL)
    app.post<{ Params: { id: string } }>('/:id/files', async (req, reply) => {
      const parsed = FilesSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, code: 'ERR_BAD_INPUT' });
      }
      const { rows } = await deps.pool.query(
        `UPDATE islands SET files_url = $1 WHERE id = $2 RETURNING id`,
        [parsed.data.files_url, req.params.id],
      );
      if (rows.length === 0) {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_ISLAND' });
      }
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'island.files',
        targetId: req.params.id,
        payload: { files_url: parsed.data.files_url },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      return reply.send({ ok: true });
    });

    // PATCH /admin/islands/:id/status
    app.patch<{ Params: { id: string } }>('/:id/status', async (req, reply) => {
      const parsed = StatusSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, code: 'ERR_BAD_INPUT' });
      }
      const { rows } = await deps.pool.query<{ id: string; slug: string; status: string }>(
        `UPDATE islands SET status = $1 WHERE id = $2 RETURNING id, slug, status`,
        [parsed.data.status, req.params.id],
      );
      if (rows.length === 0) {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_ISLAND' });
      }
      await audit(deps.pool, {
        adminPirateId: (req as unknown as { user: { id: string } }).user.id,
        action: 'island.status',
        targetId: req.params.id,
        payload: { status: parsed.data.status },
        ip: req.ip ?? null,
        userAgent: req.headers['user-agent'] ?? null,
      });
      if (deps.broadcastIslandStatus) {
        deps.broadcastIslandStatus({ slug: rows[0].slug, status: parsed.data.status });
      }
      return reply.send({ ok: true, island: rows[0] });
    });

    // POST /admin/islands/:id/whispers
    app.post<{ Params: { id: string } }>('/:id/whispers', async (req, reply) => {
      const parsed = WhisperSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ ok: false, code: 'ERR_BAD_INPUT', issues: parsed.error.issues });
      }
      try {
        const { rows } = await deps.pool.query<{ id: string }>(
          `INSERT INTO whispers (island_id, ordinal, body_md, cost_points)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [req.params.id, parsed.data.ordinal, parsed.data.body_md, parsed.data.cost_points],
        );
        await audit(deps.pool, {
          adminPirateId: (req as unknown as { user: { id: string } }).user.id,
          action: 'whisper.create',
          targetId: rows[0].id,
          payload: { island_id: req.params.id, ordinal: parsed.data.ordinal },
          ip: req.ip ?? null,
          userAgent: req.headers['user-agent'] ?? null,
        });
        return reply.code(201).send({ ok: true, whisper_id: rows[0].id });
      } catch (err) {
        const e = err as { code?: string };
        if (e.code === '23505') {
          return reply.code(409).send({ ok: false, code: 'ERR_WHISPER_EXISTS', message: 'Whisper already exists at that ordinal.' });
        }
        throw err;
      }
    });

    // GET /admin/islands/:id/stats
    app.get<{ Params: { id: string } }>('/:id/stats', async (req, reply) => {
      const { rows: islandRows } = await deps.pool.query<{
        slug: string; title: string; current_points: number; first_blood_crew: string | null;
      }>(
        `SELECT slug, title, current_points, first_blood_crew FROM islands WHERE id = $1`,
        [req.params.id],
      );
      if (islandRows.length === 0) {
        return reply.code(404).send({ ok: false, code: 'ERR_NO_ISLAND' });
      }
      const { rows: countRows } = await deps.pool.query<{
        attempts: string; solves: string;
      }>(
        `SELECT COUNT(*)::text AS attempts,
                COUNT(*) FILTER (WHERE is_correct)::text AS solves
           FROM submissions WHERE island_id = $1`,
        [req.params.id],
      );
      let firstBloodCrewName: string | null = null;
      if (islandRows[0].first_blood_crew) {
        const fb = await deps.pool.query<{ name: string }>(
          `SELECT name FROM crews WHERE id = $1`,
          [islandRows[0].first_blood_crew],
        );
        firstBloodCrewName = fb.rows[0]?.name ?? null;
      }
      return reply.send({
        ok: true,
        stats: {
          ...islandRows[0],
          first_blood_crew_name: firstBloodCrewName,
          attempts: Number(countRows[0]?.attempts ?? 0),
          solves: Number(countRows[0]?.solves ?? 0),
        },
      });
    });
  };
}
