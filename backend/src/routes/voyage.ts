import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { Pool } from 'pg';
import type { Redis } from 'ioredis';
import type { Env } from '../config/env.js';
import { isFrozen } from '../services/voyage.js';

interface Deps {
  pool: Pool;
  redis: Redis;
  env: Env;
}

/**
 * Public voyage state — read-only.
 *
 * The admin route at `/api/admin/voyage` covers the same data behind auth so
 * the captain's console can see + freeze/unfreeze. Players need to know the
 * freeze flag too (the closing-ceremony screen and the live submit lock both
 * key off it), but the admin gate would force every player into a 401 ping
 * loop. We expose a public `GET /api/voyage/state` that returns just the
 * boolean, no PII, no auth required — same data the WS pushes via the
 * `voyage.frozen` / `voyage.unfrozen` events.
 *
 * Caching is already done by `services/voyage.ts::isFrozen` (Redis, 30s TTL),
 * so this is essentially free even at full Voyage load.
 */
export function voyageRoutes(deps: Deps): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    app.get('/state', async () => {
      const frozen = await isFrozen(deps.pool, deps.redis);
      return { ok: true, frozen };
    });
  };
}
